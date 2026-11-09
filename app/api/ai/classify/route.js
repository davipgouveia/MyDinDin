import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getUserFromRequest, getClientIp } from '../../../../src/lib/serverAuth'
import { rateLimit } from '../../../../src/lib/rateLimit'

// Classificação de descrições de extrato por IA. Recebe SOMENTE os
// textos das descrições (sem valores, datas ou dados da conta) e a
// lista de categorias do grupo; devolve uma sugestão por item, e só
// quando a IA tem confiança — quem confirma é sempre a pessoa.
// Chaves só no servidor: GROQ_API_KEY (preferida) ou GEMINI_API_KEY.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
const MAX_ITEMS = 60

function buildPrompt(items, categories) {
  // Os itens são numerados (1, 2, 3...) de propósito: pedir pro modelo
  // devolver a chave crua do grupo ("expense|pix transf laryssa") fazia
  // ele alterar a chave (caixa, espaços, o "|") e a validação descartar
  // TODAS as sugestões. Número simples não tem como errar.
  const list = items
    .map((item, index) => `${index + 1}. (${item.type === 'income' ? 'entrada' : 'saída'}) ${item.description}`)
    .join('\n')

  return [
    'Você classifica descrições de extrato bancário brasileiro em categorias de finanças pessoais.',
    `Categorias permitidas (use EXATAMENTE um destes nomes): ${categories.join(' | ')}`,
    'Regras:',
    '- PIX/TED com nome de pessoa: se não der pra saber o motivo, NÃO responda o item.',
    '- Tarifas, IOF, anuidade e pacote de serviços do banco são "Contas & Serviços" (se essa categoria existir).',
    '- "REND PAGO APLIC" e rendimentos de aplicação são "Investimentos" (se existir).',
    '- Responda SOMENTE com um objeto JSON no formato {"suggestions":[{"id":1,"category":"..."}]}, sem texto antes ou depois.',
    '- Omita os itens em que você não tiver confiança razoável.',
    '',
    'Descrições:',
    list,
  ].join('\n')
}

function parseSuggestions(text, items, categories) {
  const raw = String(text || '')

  // Aceita o objeto {"suggestions":[...]} e, por segurança, um array
  // solto [...]. Modelos de raciocínio às vezes cercam o JSON de texto:
  // recorta do primeiro abre ao último fecha do formato encontrado.
  let parsed = null
  const objStart = raw.indexOf('{')
  const objEnd = raw.lastIndexOf('}')
  if (objStart !== -1 && objEnd > objStart) {
    try {
      const candidate = JSON.parse(raw.slice(objStart, objEnd + 1))
      if (candidate && Array.isArray(candidate.suggestions)) parsed = candidate.suggestions
    } catch {
      parsed = null
    }
  }
  if (!parsed) {
    const arrStart = raw.indexOf('[')
    const arrEnd = raw.lastIndexOf(']')
    if (arrStart === -1 || arrEnd <= arrStart) return []
    try {
      const candidate = JSON.parse(raw.slice(arrStart, arrEnd + 1))
      if (Array.isArray(candidate)) parsed = candidate
    } catch {
      return []
    }
  }
  if (!parsed) return []

  const canonicalByNormalized = new Map(
    categories.map((name) => [name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(), name]),
  )

  const suggestions = []
  parsed.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return
    const index = Number(entry.id) - 1
    if (!Number.isInteger(index) || index < 0 || index >= items.length) return
    const normalized = String(entry.category || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    const canonical = canonicalByNormalized.get(normalized)
    if (canonical) suggestions.push({ key: items[index].key, category: canonical })
  })

  return suggestions
}

async function callGroq(apiKey, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      // Tarefa mecânica: raciocínio baixo responde mais rápido e foca
      // no JSON pedido, sem cercar a resposta de texto.
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Groq respondeu ${response.status}: ${detail.slice(0, 300)}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || ''
}

async function callGemini(apiKey, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para usar a classificação por IA.' },
        { status: 401 },
      )
    }

    const porUsuario = rateLimit(`ai-classify:user:${user.id}`, 20, 15 * 60 * 1000)
    const porIp = rateLimit(`ai-classify:ip:${getClientIp(request)}`, 40, 15 * 60 * 1000)
    if (!porUsuario.ok || !porIp.ok) {
      return NextResponse.json(
        { error: 'Muitas classificações em pouco tempo. Aguarde um instante e tente de novo.' },
        { status: 429 },
      )
    }

    const groqKey = process.env.GROQ_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY
    if (!groqKey && !geminiKey) {
      return NextResponse.json(
        { error: 'IA não configurada no servidor.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 },
      )
    }

    const body = await request.json().catch(() => ({}))
    const categories = (Array.isArray(body?.categories) ? body.categories : [])
      .map((name) => String(name || '').trim())
      .filter(Boolean)
      .slice(0, 40)
    const items = (Array.isArray(body?.items) ? body.items : [])
      .map((item) => ({
        key: String(item?.key || '').slice(0, 80),
        description: String(item?.description || '').slice(0, 140).trim(),
        type: item?.type === 'income' ? 'income' : 'expense',
      }))
      .filter((item) => item.key && item.description)
      .slice(0, MAX_ITEMS)

    if (categories.length === 0 || items.length === 0) {
      return NextResponse.json({ error: 'Nada para classificar.' }, { status: 400 })
    }

    const prompt = buildPrompt(items, categories)
    const text = groqKey ? await callGroq(groqKey, prompt) : await callGemini(geminiKey, prompt)

    return NextResponse.json({ suggestions: parseSuggestions(text, items, categories) })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Falha inesperada na classificação.' },
      { status: 500 },
    )
  }
}

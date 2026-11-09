import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getUserFromRequest, getClientIp } from '../../../../src/lib/serverAuth'
import { rateLimit } from '../../../../src/lib/rateLimit'

// As chaves de IA ficam SOMENTE no servidor.
// Ordem de preferência: GROQ_API_KEY (Groq, plano gratuito sem cartão)
// e depois GEMINI_API_KEY (Gemini, reserva). Sem nenhuma das duas, a
// rota responde 503 e o cliente cai para o cérebro local (regras).
const tools = [
  {
    functionDeclarations: [
      {
        name: 'add_budget',
        description: 'Cria um novo limite de orçamento para uma categoria de gastos específica.',
        parameters: {
          type: 'OBJECT',
          properties: {
            category: {
              type: 'STRING',
              description: 'A categoria da despesa em minúsculas (ex: alimentacao, transporte, lazer, contas, shopping).',
            },
            limit: {
              type: 'NUMBER',
              description: 'O valor limite do orçamento em reais.',
            },
          },
          required: ['category', 'limit'],
        },
      },
      {
        name: 'add_category',
        description: 'Cria uma nova categoria de despesa ou receita.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: {
              type: 'STRING',
              description: 'Nome da categoria (ex: Pet, Farmácia, Cursos).',
            },
            type: {
              type: 'STRING',
              enum: ['expense', 'income'],
              description: "Tipo da categoria: 'expense' para despesa ou 'income' para receita.",
            },
          },
          required: ['name', 'type'],
        },
      },
    ],
  },
]

// Converte as declarações acima (formato Google) para o formato de
// ferramentas da API compatível com OpenAI (usado pela Groq).
function toOpenAITools(googleTools) {
  const lowerTypes = (node) => {
    if (Array.isArray(node)) return node.map(lowerTypes)
    if (node && typeof node === 'object') {
      const out = {}
      for (const [key, value] of Object.entries(node)) {
        out[key] = key === 'type' && typeof value === 'string' ? value.toLowerCase() : lowerTypes(value)
      }
      return out
    }
    return node
  }

  return googleTools.flatMap((group) =>
    (group.functionDeclarations || []).map((fn) => ({
      type: 'function',
      function: {
        name: fn.name,
        description: fn.description,
        parameters: lowerTypes(fn.parameters),
      },
    })),
  )
}

const MAX_MESSAGE_LENGTH = 2000
const MAX_SYSTEM_PROMPT_LENGTH = 8000
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

async function callGroq(apiKey, message, systemPrompt) {
  const baseBody = {
    model: GROQ_MODEL,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: message },
    ],
    temperature: 0.4,
  }

  const send = async (withTools) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify(withTools ? { ...baseBody, tools: toOpenAITools(tools), tool_choice: 'auto' } : baseBody),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Groq respondeu ${response.status}: ${detail.slice(0, 300)}`)
    }

    return response.json()
  }

  let data
  try {
    data = await send(true)
  } catch (firstError) {
    // Alguns modelos gratuitos falham ao montar a chamada de ferramenta
    // (tool_use_failed). Nesse caso, tenta de novo sem as ferramentas:
    // a conversa continua em texto, em vez de cair no cérebro local.
    data = await send(false)
  }

  const choice = data?.choices?.[0]?.message
  const toolCall = choice?.tool_calls?.[0]

  if (toolCall?.function?.name) {
    let args = {}
    try {
      args = JSON.parse(toolCall.function.arguments || '{}')
    } catch {
      args = {}
    }
    return { isFunction: true, functionCall: { name: toolCall.function.name, args } }
  }

  const text = typeof choice?.content === 'string' ? choice.content.trim() : ''
  if (!text) {
    throw new Error('Groq respondeu sem texto.')
  }

  return { isFunction: false, text }
}

async function callGemini(apiKey, message, systemPrompt) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt || undefined,
    tools,
  })

  const chat = model.startChat()
  const result = await chat.sendMessage(message)
  const response = result.response

  const functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : null
  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0]
    return {
      isFunction: true,
      functionCall: { name: call.name, args: call.args || {} },
    }
  }

  return { isFunction: false, text: response.text() }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para usar o assistente.' },
        { status: 401 },
      )
    }

    const porUsuario = rateLimit(`ai:user:${user.id}`, 30, 15 * 60 * 1000)
    const porIp = rateLimit(`ai:ip:${getClientIp(request)}`, 60, 15 * 60 * 1000)
    if (!porUsuario.ok || !porIp.ok) {
      return NextResponse.json(
        { error: 'Muitas mensagens em pouco tempo. Aguarde um instante e tente de novo.' },
        { status: 429 },
      )
    }

    const groqKey = process.env.GROQ_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY
    if (!groqKey && !geminiKey) {
      // Sem chave no servidor: o cliente cai para o cérebro local (regras).
      return NextResponse.json(
        { error: 'Assistente de IA não configurado no servidor.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 },
      )
    }

    const { message, systemPrompt } = await request.json()
    const normalizedMessage = String(message || '').slice(0, MAX_MESSAGE_LENGTH)
    const normalizedSystemPrompt = String(systemPrompt || '').slice(0, MAX_SYSTEM_PROMPT_LENGTH)

    if (!normalizedMessage.trim()) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
    }

    const result = groqKey
      ? await callGroq(groqKey, normalizedMessage, normalizedSystemPrompt)
      : await callGemini(geminiKey, normalizedMessage, normalizedSystemPrompt)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Falha inesperada no assistente.' },
      { status: 500 },
    )
  }
}

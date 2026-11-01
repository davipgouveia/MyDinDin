import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getUserFromRequest, getClientIp } from '../../../../src/lib/serverAuth'
import { rateLimit } from '../../../../src/lib/rateLimit'

// A chave do Gemini fica SOMENTE no servidor (GEMINI_API_KEY).
// Antes ela era NEXT_PUBLIC_ e ia embutida no navegador de todo visitante.
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

const MAX_MESSAGE_LENGTH = 2000
const MAX_SYSTEM_PROMPT_LENGTH = 8000

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

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
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

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: normalizedSystemPrompt || undefined,
      tools,
    })

    const chat = model.startChat()
    const result = await chat.sendMessage(normalizedMessage)
    const response = result.response

    const functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : null
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]
      return NextResponse.json({
        isFunction: true,
        functionCall: { name: call.name, args: call.args || {} },
      })
    }

    return NextResponse.json({ isFunction: false, text: response.text() })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Falha inesperada no assistente.' },
      { status: 500 },
    )
  }
}

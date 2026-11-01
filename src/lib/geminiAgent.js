// src/lib/geminiAgent.js
// Cliente do assistente de IA: chama a rota de servidor /api/ai/chat.
// A chave do Gemini NÃO fica mais no navegador — ela vive só no servidor
// (variável GEMINI_API_KEY). Se a rota responder que a IA não está
// configurada ou falhar, quem chama decide o fallback (cérebro local).
import { getAuthHeaders } from './authToken'

export async function askGemini(userMessage, systemPrompt) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify({ message: userMessage, systemPrompt }),
  })

  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    const error = new Error(payload?.error || `Erro ao chamar o assistente: ${response.status}`)
    error.code = payload?.code || (response.status === 503 ? 'AI_NOT_CONFIGURED' : undefined)
    error.status = response.status
    throw error
  }

  const data = await response.json()

  if (data?.isFunction && data.functionCall) {
    return { isFunction: true, functionCall: data.functionCall }
  }

  return { isFunction: false, text: data?.text || '' }
}

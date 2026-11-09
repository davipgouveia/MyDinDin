// Cliente da classificação por IA: manda só os textos das descrições
// (sem valores nem dados da conta) pra rota /api/ai/classify e devolve
// um mapa chave → categoria sugerida. Quem aplica é sempre a pessoa.
import { getAuthHeaders } from './authToken'

export async function classifyDescriptionsWithAI(items, categories) {
  const response = await fetch('/api/ai/classify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify({ items, categories }),
  })

  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    const error = new Error(payload?.error || `Erro ao classificar com IA: ${response.status}`)
    error.code = payload?.code
    error.status = response.status
    throw error
  }

  const data = await response.json()
  const map = new Map()
  ;(data?.suggestions || []).forEach((suggestion) => {
    if (suggestion?.key && suggestion?.category) map.set(suggestion.key, suggestion.category)
  })
  return map
}

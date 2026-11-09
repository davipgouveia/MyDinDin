// Padrões aprendidos de descrição → categoria, compartilhados entre a
// importação de extrato e a fila de classificação. A chave é a
// assinatura da descrição (descriptionSignature) e o mapa fica salvo no
// aparelho: classificar uma vez ensina todas as próximas.
const STORAGE_KEY = 'mydindin_description_patterns'

export function readDescriptionPatterns() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDescriptionPattern(signature, category) {
  if (!signature || !category) return
  try {
    const current = readDescriptionPatterns()
    if (current[signature] === category) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [signature]: category }))
  } catch {
    // Sem localStorage, o aprendizado simplesmente não persiste.
  }
}

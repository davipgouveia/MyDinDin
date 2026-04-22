export const parseDateValue = (value) => {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const toDateKey = (value) => {
  const date = parseDateValue(value)
  return date ? date.toISOString().split('T')[0] : null
}

// Retorna o início do dia (00:00:00) para uma data
export function startOfDay(date) {
  const d = parseDateValue(date)
  if (!d) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Formata uma data para o padrão brasileiro (dd/mm/yyyy)
export function formatDateBR(date, fallback = '') {
  const d = parseDateValue(date)
  if (!d) return fallback
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
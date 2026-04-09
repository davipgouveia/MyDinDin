export const parseDateValue = (value) => {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const toDateKey = (value) => {
  const date = parseDateValue(value)
  return date ? date.toISOString().split('T')[0] : null
}

export const formatDateBR = (value, fallback = 'Data indisponível') => {
  const date = parseDateValue(value)
  if (!date) return fallback

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export const startOfDay = (value) => {
  const date = parseDateValue(value)
  if (!date) return null

  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}
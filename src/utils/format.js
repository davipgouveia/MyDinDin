import { parseDateValue } from './date'

export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

export const formatDate = (isoDate, fallback = 'Data indisponível') => {
  const date = parseDateValue(isoDate)
  if (!date) return fallback

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

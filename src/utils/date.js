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

const MONTH_NAMES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

// Formata um mês de referência (ex.: month_start de orçamento) como
// "novembro/2026". Lê ano/mês direto da string quando ela vem como
// 'YYYY-MM-DD' para não sofrer deslocamento de fuso (new Date('2026-11-01')
// em UTC-3 cai em 31/10 — era o bug do "Mês: 31/10/2026").
export function formatMonthYearBR(value, fallback = '') {
  if (!value) return fallback

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})/)
    if (match) {
      const monthName = MONTH_NAMES_PT[Number(match[2]) - 1]
      if (monthName) return `${monthName}/${match[1]}`
    }
  }

  const d = parseDateValue(value)
  if (!d) return fallback
  return `${MONTH_NAMES_PT[d.getMonth()]}/${d.getFullYear()}`
}
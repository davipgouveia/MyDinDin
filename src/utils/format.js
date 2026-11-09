import { parseDateValue } from './date'

export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

// Dinheiro se soma em centavos: somar decimais em float gera poeira
// (2852.1200000000003). Toda agregação monetária passa por aqui.
export const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100

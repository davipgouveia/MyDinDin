import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CalendarRange, TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../utils/format'
import { parseDateValue } from '../utils/date'

const DAY_MS = 24 * 60 * 60 * 1000

function summarize(transactions, start, end) {
  let income = 0
  let expense = 0
  let count = 0
  const byCategory = new Map()

  transactions.forEach((tx) => {
    const date = parseDateValue(tx.date || tx.transaction_date)
    if (!date || date < start || date >= end) return
    const amount = Math.abs(Number(tx.amount) || 0)
    count += 1
    if (tx.type === 'income') {
      income += amount
    } else {
      expense += amount
      byCategory.set(tx.category, (byCategory.get(tx.category) || 0) + amount)
    }
  })

  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0] || null

  return { income, expense, balance: income - expense, count, topCategory }
}

export function WeeklySummary({ transactions = [], panelClass = '' }) {
  const { current, previous } = useMemo(() => {
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const start = new Date(end.getTime() - 7 * DAY_MS)
    const previousStart = new Date(start.getTime() - 7 * DAY_MS)

    return {
      current: summarize(transactions, start, end),
      previous: summarize(transactions, previousStart, start),
    }
  }, [transactions])

  const expenseDelta = previous.expense > 0
    ? ((current.expense - previous.expense) / previous.expense) * 100
    : null

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-violet-400/10 p-1.5 text-violet-300">
          <CalendarRange size={14} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Sua semana (últimos 7 dias)</h2>
      </div>

      {current.count === 0 ? (
        <p className="text-sm text-slate-400">
          Nenhum lançamento nos últimos 7 dias. Sem culpa: importa o extrato ou a fatura que o app fica em dia em 1 minuto.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Entrou</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">{formatCurrency(current.income)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Saiu</p>
            <p className="mt-1 text-lg font-semibold text-red-300">{formatCurrency(current.expense)}</p>
            {expenseDelta !== null && Math.abs(expenseDelta) >= 1 && (
              <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${expenseDelta > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                {expenseDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {expenseDelta > 0 ? '+' : ''}{expenseDelta.toFixed(0)}% vs. semana anterior
              </p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Saldo da semana</p>
            <p className={`mt-1 text-lg font-semibold ${current.balance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatCurrency(current.balance)}
            </p>
            {current.topCategory && (
              <p className="mt-0.5 text-[11px] text-slate-400">
                Maior gasto: {current.topCategory[0]} ({formatCurrency(current.topCategory[1])})
              </p>
            )}
          </div>
        </div>
      )}
    </motion.section>
  )
}

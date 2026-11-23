import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import TransactionItem from './TransactionItem'
import { formatCurrency } from '../utils/format'

const PAGE_SIZE = 15

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function monthKeyOf(transaction) {
  const date = transaction.date || transaction.created_at || ''
  return date.slice(0, 7)
}

function monthLabel(key) {
  const [year, month] = key.split('-')
  const name = MONTH_NAMES[Number(month) - 1] || month
  return `${name} de ${year}`
}

// Visualização de TODAS as transações, agrupadas por mês (setores).
// Carregamento setorizado: cada setor só renderiza seus itens quando aberto,
// e dentro do setor os itens entram em páginas de PAGE_SIZE via "Mostrar mais".
export default function TransactionsView({
  transactions,
  panelClass = '',
  transactionComments = {},
  onAddComment,
  onDeleteTransaction,
  canDeleteTx,
}) {
  const [query, setQuery] = useState('')
  const [openSections, setOpenSections] = useState({})
  const [visibleCounts, setVisibleCounts] = useState({})

  const sections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = normalizedQuery
      ? transactions.filter((tx) =>
          [tx.description, tx.category, tx.owner]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(normalizedQuery)),
        )
      : transactions

    const byMonth = new Map()
    filtered.forEach((tx) => {
      const key = monthKeyOf(tx)
      if (!key) return
      if (!byMonth.has(key)) byMonth.set(key, [])
      byMonth.get(key).push(tx)
    })

    return [...byMonth.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, items]) => {
        const income = items
          .filter((tx) => tx.type === 'income')
          .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0)
        const expense = items
          .filter((tx) => tx.type !== 'income')
          .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0)
        return { key, label: monthLabel(key), items, income, expense, balance: income - expense }
      })
  }, [transactions, query])

  const isOpen = (key, index) => openSections[key] ?? index === 0
  const visibleCount = (key) => visibleCounts[key] ?? PAGE_SIZE

  return (
    <section className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
          Todas as transações
        </h2>
        <label className="relative block sm:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por descrição, categoria..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </label>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
          Nenhuma transação encontrada.
        </p>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => {
            const open = isOpen(section.key, index)
            const count = visibleCount(section.key)
            const shown = open ? section.items.slice(0, count) : []
            const remaining = section.items.length - shown.length
            return (
              <div key={section.key} className="overflow-hidden rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    setOpenSections((current) => ({ ...current, [section.key]: !open }))
                  }
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 bg-slate-900/70 px-4 py-3 text-left"
                >
                  {open ? (
                    <ChevronDown size={16} className="shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="shrink-0 text-slate-400" />
                  )}
                  <span className="text-sm font-semibold text-slate-100">{section.label}</span>
                  <span className="text-xs text-slate-400">
                    {section.items.length} {section.items.length === 1 ? 'lançamento' : 'lançamentos'}
                  </span>
                  <span className="ml-auto flex flex-wrap gap-x-3 text-xs">
                    <span className="text-income">+{formatCurrency(section.income)}</span>
                    <span className="text-expense">-{formatCurrency(section.expense)}</span>
                    <span className="font-medium text-slate-200">
                      Saldo {formatCurrency(section.balance)}
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="p-3">
                    <ul className="space-y-2">
                      {shown.map((transaction) => (
                        <TransactionItem
                          key={transaction.id}
                          transaction={transaction}
                          onDelete={onDeleteTransaction}
                          canDelete={canDeleteTx ? canDeleteTx(transaction) : true}
                          comments={transactionComments[transaction.id] || []}
                          onAddComment={onAddComment}
                        />
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Mostrando {shown.length} de {section.items.length} neste mês
                      </p>
                      {remaining > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleCounts((current) => ({
                              ...current,
                              [section.key]: count + PAGE_SIZE,
                            }))
                          }
                          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
                        >
                          Mostrar mais ({remaining} restantes)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

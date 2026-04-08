import { ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/format'

export default function TransactionItem({ transaction, onDelete }) {
  const isIncome = transaction.type === 'income'
  const isPaid = transaction.isPaid !== false

  return (
    <li className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {isIncome ? (
            <ArrowUpCircle className="mt-0.5 text-income" size={18} />
          ) : (
            <ArrowDownCircle className="mt-0.5 text-expense" size={18} />
          )}
          <div>
            <p className="text-sm font-medium text-slate-100">{transaction.description}</p>
            <p className="text-xs text-slate-400">
              {transaction.category} • {transaction.owner} • {formatDate(transaction.date)}
              {transaction.dueDate ? ` • vence ${formatDate(transaction.dueDate)}` : ''}
              {transaction.dueDate ? ` • ${isPaid ? 'pago' : 'em aberto'}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Excluir transacao"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </li>
  )
}

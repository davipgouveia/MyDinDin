import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tags, Wand2 } from 'lucide-react'
import { suggestCategory, UNCATEGORIZED_LABEL } from '../lib/quickParse'
import { formatCurrency } from '../utils/format'
import { formatDateBR } from '../utils/date'
import { toast } from '../hooks/useToast'

function PendingRow({ transaction, categories, learnedMap, onClassify }) {
  const suggestion = suggestCategory(transaction.description, {
    categories,
    learnedMap,
    type: transaction.type,
  })
  const [selected, setSelected] = useState(suggestion || '')
  const [saving, setSaving] = useState(false)

  const apply = async (category) => {
    if (!category || saving) return
    setSaving(true)
    try {
      await onClassify(transaction.id, category)
      toast.success(`"${transaction.description}" agora é ${category}.`)
    } catch (classifyError) {
      toast.error(`Erro ao classificar: ${classifyError.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{transaction.description}</p>
        <p className="text-xs text-slate-400">
          {transaction.owner} • {formatDateBR(transaction.date)} •{' '}
          <span className={transaction.type === 'income' ? 'text-emerald-300' : 'text-red-300'}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {suggestion && (
          <button
            type="button"
            disabled={saving}
            onClick={() => apply(suggestion)}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <Wand2 size={12} />
            {suggestion}
          </button>
        )}
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
        >
          <option value="">Escolher categoria...</option>
          {categories.filter((category) => category !== UNCATEGORIZED_LABEL).map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selected || saving}
          onClick={() => apply(selected)}
          className="rounded-lg bg-cyan-500 px-2.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? '...' : 'Classificar'}
        </button>
      </div>
    </li>
  )
}

export function PendingClassification({ transactions = [], categories = [], learnedMap = null, onClassify, panelClass = '' }) {
  if (transactions.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-full bg-amber-400/10 p-1.5 text-amber-300">
          <Tags size={14} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
          Classificar quando puder ({transactions.length})
        </h2>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        Nada trava por causa disso — é só tocar na sugestão ou escolher a categoria quando tiver um minuto.
      </p>

      <ul className="space-y-2">
        {transactions.slice(0, 10).map((transaction) => (
          <PendingRow
            key={transaction.id}
            transaction={transaction}
            categories={categories}
            learnedMap={learnedMap}
            onClassify={onClassify}
          />
        ))}
      </ul>
      {transactions.length > 10 && (
        <p className="mt-2 text-xs text-slate-500">... e mais {transactions.length - 10} aguardando. Um pouco por vez também vale.</p>
      )}
    </motion.section>
  )
}

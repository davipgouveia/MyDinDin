import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { parseQuickEntry, UNCATEGORIZED_LABEL } from '../lib/quickParse'
import { formatCurrency } from '../utils/format'
import { formatDateBR } from '../utils/date'
import { toast } from '../hooks/useToast'

export function QuickCapture({ categories = [], learnedMap = null, onSubmit, panelClass = '' }) {
  const [text, setText] = useState('')
  const [categoryOverride, setCategoryOverride] = useState('')
  const [sending, setSending] = useState(false)

  const parsed = useMemo(
    () => parseQuickEntry(text, { categories, learnedMap }),
    [text, categories, learnedMap],
  )

  const effectiveCategory = categoryOverride || parsed?.category || UNCATEGORIZED_LABEL
  const categoryOptions = useMemo(() => {
    const options = [UNCATEGORIZED_LABEL, ...categories]
    if (parsed?.category && !options.includes(parsed.category)) options.push(parsed.category)
    return [...new Set(options)]
  }, [categories, parsed?.category])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!parsed || sending) return

    setSending(true)
    try {
      await onSubmit({
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description,
        category: effectiveCategory,
        dateISO: parsed.dateISO,
      })
      toast.success(
        `${parsed.type === 'income' ? 'Receita' : 'Despesa'} de ${formatCurrency(parsed.amount)} lançada: ${parsed.description}`,
      )
      setText('')
      setCategoryOverride('')
    } catch (submitError) {
      toast.error(`Erro ao lançar: ${submitError.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-cyan-400/10 p-1.5 text-cyan-300">
          <Zap size={14} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Lançamento rápido</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setCategoryOverride('')
          }}
          placeholder='Ex.: "50 mercado", "paguei 120 de luz", "recebi 3000 salário"'
          className="w-full flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!parsed || sending}
          className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Lançando...' : 'Lançar'}
        </button>
      </form>

      {text.trim() && !parsed && (
        <p className="mt-2 text-xs text-slate-400">Não encontrei um valor. Escreva o valor junto, ex.: &quot;50 mercado&quot;.</p>
      )}

      {parsed && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full border px-2.5 py-1 font-semibold ${parsed.type === 'income' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-red-400/30 bg-red-400/10 text-red-200'}`}>
            {parsed.type === 'income' ? 'Receita' : 'Despesa'} • {formatCurrency(parsed.amount)}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
            {parsed.description}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">
            {formatDateBR(parsed.dateISO)}
          </span>
          <label className="flex items-center gap-1.5 text-slate-400">
            Categoria:
            <select
              value={effectiveCategory}
              onChange={(event) => setCategoryOverride(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          {effectiveCategory === UNCATEGORIZED_LABEL && (
            <span className="text-slate-500">sem categoria — dá pra classificar depois, sem pressa</span>
          )}
        </div>
      )}
    </motion.section>
  )
}

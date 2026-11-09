import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileUp, Upload } from 'lucide-react'
import { dedupeKey, parseStatementText } from '../lib/statementImport'
import { suggestCategory, UNCATEGORIZED_LABEL } from '../lib/quickParse'
import { formatCurrency } from '../utils/format'
import { formatDateBR } from '../utils/date'
import { toast } from '../hooks/useToast'

export function StatementImport({ transactions = [], categories = [], learnedMap = null, onImport, panelClass = '' }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [fileLabel, setFileLabel] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  const existingKeys = useMemo(
    () => new Set(transactions.map((tx) => dedupeKey(tx.date, Math.abs(Number(tx.amount) || 0), tx.description))),
    [transactions],
  )

  const selectedCount = rows.filter((row) => row.selected).length
  const duplicateCount = rows.filter((row) => row.duplicate).length
  const totals = useMemo(() => rows.reduce((acc, row) => {
    if (!row.selected) return acc
    if (row.type === 'income') acc.income += row.amount
    else acc.expense += row.amount
    return acc
  }, { income: 0, expense: 0 }), [rows])

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const { rows: parsedRows, format } = parseStatementText(text, file.name)

      if (parsedRows.length === 0) {
        toast.error('Não reconheci lançamentos nesse arquivo. Tente o CSV ou OFX exportado do banco ou da fatura.')
        return
      }

      const seenInFile = new Set()
      const prepared = parsedRows.map((row, index) => {
        const key = dedupeKey(row.dateISO, row.amount, row.description)
        const duplicate = existingKeys.has(key) || seenInFile.has(key)
        seenInFile.add(key)

        return {
          id: `import_${index}`,
          ...row,
          key,
          duplicate,
          selected: !duplicate,
          category: suggestCategory(row.description, { categories, learnedMap, type: row.type }) || UNCATEGORIZED_LABEL,
        }
      })

      setRows(prepared)
      setFileLabel(`${file.name} (${format})`)
      setOpen(true)
      toast.success(`${prepared.length} lançamentos lidos do arquivo. Confira e importe os que quiser.`)
    } catch (fileError) {
      toast.error(`Erro ao ler o arquivo: ${fileError.message}`)
    }
  }

  const handleImport = async () => {
    const selected = rows.filter((row) => row.selected)
    if (selected.length === 0 || importing) return

    setImporting(true)
    try {
      const count = await onImport(selected.map((row) => ({
        date: row.dateISO,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.category,
      })))
      toast.success(`${count} lançamentos importados. O app está em dia!`)
      setRows([])
      setFileLabel('')
      setOpen(false)
    } catch (importError) {
      toast.error(`Erro ao importar: ${importError.message}`)
    } finally {
      setImporting(false)
    }
  }

  const categoryOptions = useMemo(
    () => [...new Set([UNCATEGORIZED_LABEL, ...categories])],
    [categories],
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-400/10 p-1.5 text-emerald-300">
            <FileUp size={14} />
          </span>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Ficar em dia</h2>
            <p className="text-xs text-slate-400">Importe o extrato da conta ou a fatura do cartão (CSV ou OFX) e o mês se reconstrói sozinho.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Upload size={14} />
          Importar arquivo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.ofx,.txt,text/csv"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {open && rows.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1">{fileLabel}</span>
            <span>{rows.length} lançamentos</span>
            <span>•</span>
            <span>{selectedCount} selecionados</span>
            {duplicateCount > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-300">{duplicateCount} já existem (desmarcados)</span>
              </>
            )}
            <span>•</span>
            <span className="text-emerald-300">+{formatCurrency(totals.income)}</span>
            <span className="text-red-300">-{formatCurrency(totals.expense)}</span>
          </div>

          <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`flex flex-col gap-2 rounded-xl border px-3 py-2 sm:flex-row sm:items-center ${row.duplicate ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-800 bg-slate-900/70'}`}
              >
                <label className="flex min-w-0 flex-1 items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(event) => setRows((prev) => prev.map((item) => (
                      item.id === row.id ? { ...item, selected: event.target.checked } : item
                    )))}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-100">{row.description}</span>
                    <span className="block text-xs text-slate-400">
                      {formatDateBR(row.dateISO)} •{' '}
                      <span className={row.type === 'income' ? 'text-emerald-300' : 'text-red-300'}>
                        {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
                      </span>
                      {row.duplicate && <span className="text-amber-300"> • já existe no app</span>}
                    </span>
                  </span>
                </label>

                <select
                  value={row.category}
                  onChange={(event) => setRows((prev) => prev.map((item) => (
                    item.id === row.id ? { ...item, category: event.target.value } : item
                  )))}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={selectedCount === 0 || importing}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? 'Importando...' : `Importar ${selectedCount} lançamentos`}
            </button>
            <button
              type="button"
              onClick={() => { setRows([]); setOpen(false) }}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </motion.section>
  )
}

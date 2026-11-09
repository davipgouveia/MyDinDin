import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileUp, Upload, Loader2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { dedupeKey, descriptionSignature, parseStatementText } from '../lib/statementImport'
import { extractPdfText } from '../lib/pdfStatement'
import { suggestCategory, UNCATEGORIZED_LABEL } from '../lib/quickParse'
import { formatCurrency } from '../utils/format'
import { formatDateBR } from '../utils/date'
import { toast } from '../hooks/useToast'

export function StatementImport({ transactions = [], categories = [], learnedMap = null, onImport, onImported, panelClass = '' }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [fileLabel, setFileLabel] = useState('')
  const [importing, setImporting] = useState(false)
  const [reading, setReading] = useState(false)
  // Retorno visual PERSISTENTE dentro do cartão: o toast some em 3s e a
  // pessoa fica com a sensação de que "não aconteceu nada". Aqui o status
  // de cada etapa (lendo, extraindo, encontrou, falhou e por quê) fica
  // escrito até a próxima ação.
  const [status, setStatus] = useState(null)
  // Padrões aprendidos: assinatura da descrição → categoria. Quando a
  // pessoa classifica UM lançamento, os outros com a mesma assinatura
  // (mesmo lugar, outra data) são classificados sozinhos — nesta
  // importação e nas próximas (fica salvo no aparelho).
  const [patterns, setPatterns] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mydindin_description_patterns') || '{}')
    } catch {
      return {}
    }
  })
  const fileInputRef = useRef(null)

  const savePatterns = (next) => {
    setPatterns(next)
    try {
      localStorage.setItem('mydindin_description_patterns', JSON.stringify(next))
    } catch {
      // Sem localStorage, o aprendizado vale só nesta importação.
    }
  }

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

    setStatus({ kind: 'reading', text: `Lendo ${file.name}...` })

    try {
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf'

      let text
      if (isPdf) {
        setReading(true)
        setStatus({ kind: 'reading', text: `Extraindo o texto do PDF ${file.name}...` })
        try {
          text = await extractPdfText(file)
        } finally {
          setReading(false)
        }

        if (!text.trim()) {
          const message = 'Não consegui ler texto nesse PDF — ele pode ser uma imagem escaneada. Nesse caso, exporte o CSV ou OFX pelo app do banco.'
          setStatus({ kind: 'error', text: message })
          toast.error(message)
          return
        }
      } else {
        text = await file.text()
      }

      setStatus({ kind: 'reading', text: `Procurando lançamentos em ${file.name}...` })
      const { rows: parsedRows, format } = parseStatementText(text, file.name)

      if (parsedRows.length === 0) {
        const message = `Li o arquivo ${file.name}, mas não reconheci nenhum lançamento nele. Se for PDF de outro banco, me avise qual é que eu ajusto o leitor.`
        setStatus({ kind: 'error', text: message })
        toast.error('Não reconheci lançamentos nesse arquivo. Tente o CSV, OFX ou PDF exportado do banco ou da fatura.')
        return
      }

      const seenInFile = new Set()
      const prepared = parsedRows.map((row, index) => {
        const key = dedupeKey(row.dateISO, row.amount, row.description)
        const duplicate = existingKeys.has(key) || seenInFile.has(key)
        seenInFile.add(key)

        const patternCategory = patterns[descriptionSignature(row.description)]

        return {
          id: `import_${index}`,
          ...row,
          key,
          duplicate,
          selected: !duplicate,
          fromPattern: Boolean(patternCategory),
          category: patternCategory
            || suggestCategory(row.description, { categories, learnedMap, type: row.type })
            || UNCATEGORIZED_LABEL,
        }
      })

      setRows(prepared)
      setFileLabel(`${file.name} (${format})`)
      setOpen(true)
      setStatus({ kind: 'ok', text: `${prepared.length} lançamentos encontrados em ${file.name}. Confira a lista abaixo e toque em Importar.` })
      toast.success(`${prepared.length} lançamentos lidos do arquivo. Confira e importe os que quiser.`)
    } catch (fileError) {
      setStatus({ kind: 'error', text: `Erro ao ler o arquivo: ${fileError.message}` })
      toast.error(`Erro ao ler o arquivo: ${fileError.message}`)
    }
  }

  // Classificar UM lançamento ensina o padrão: os outros da lista com a
  // mesma assinatura que ainda estão "a classificar" recebem a categoria
  // na hora, e o padrão fica salvo pras próximas importações.
  const handleCategoryChange = (row, category) => {
    const signature = descriptionSignature(row.description)
    let filled = 0
    const next = rows.map((item) => {
      if (item.id === row.id) return { ...item, category, fromPattern: false }
      if (
        category !== UNCATEGORIZED_LABEL
        && item.category === UNCATEGORIZED_LABEL
        && descriptionSignature(item.description) === signature
      ) {
        filled += 1
        return { ...item, category, fromPattern: true }
      }
      return item
    })
    setRows(next)

    if (category !== UNCATEGORIZED_LABEL) {
      if (signature) savePatterns({ ...patterns, [signature]: category })
      setStatus({
        kind: 'info',
        text: filled > 0
          ? `Padrão aprendido: "${row.description}" virou ${category} — e apliquei sozinho em mais ${filled} ${filled === 1 ? 'lançamento' : 'lançamentos'} com a mesma descrição. Nas próximas importações eles já vêm classificados.`
          : `Padrão aprendido: "${row.description}" virou ${category}. Nas próximas importações, lançamentos assim já vêm classificados.`,
      })
    }
  }

  const handleImport = async () => {
    const selected = rows.filter((row) => row.selected)
    if (selected.length === 0 || importing) return

    // Tudo que foi importado com categoria vira padrão aprendido.
    const learnedNow = { ...patterns }
    let learnedAny = false
    selected.forEach((row) => {
      if (row.category && row.category !== UNCATEGORIZED_LABEL) {
        const signature = descriptionSignature(row.description)
        if (signature && learnedNow[signature] !== row.category) {
          learnedNow[signature] = row.category
          learnedAny = true
        }
      }
    })
    if (learnedAny) savePatterns(learnedNow)

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
      setStatus({ kind: 'ok', text: `${count} lançamentos importados de ${fileLabel}. Já estão no seu painel.` })
      setRows([])
      setFileLabel('')
      setOpen(false)
      // Pós-importação guiada: o painel rola até a fila de classificação,
      // que é o próximo passo pra deixar tudo organizado.
      onImported?.()
    } catch (importError) {
      setStatus({ kind: 'error', text: `Erro ao importar: ${importError.message}` })
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
            <p className="text-xs text-slate-400">Importe o extrato da conta ou a fatura do cartão (CSV, OFX ou PDF) e o mês se reconstrói sozinho.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={reading}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
        >
          <Upload size={14} />
          {reading ? 'Lendo arquivo...' : 'Importar arquivo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.ofx,.txt,.pdf,text/csv,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {status && (
        <div
          role="status"
          className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${
            status.kind === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
              : status.kind === 'ok'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
          }`}
        >
          {status.kind === 'reading' && <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin" />}
          {status.kind === 'ok' && <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
          {status.kind === 'error' && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
          {status.kind === 'info' && <Sparkles size={14} className="mt-0.5 shrink-0" />}
          <span>{status.text}</span>
        </div>
      )}

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
                      {row.fromPattern && <span className="text-cyan-300"> • classificado pelo padrão aprendido</span>}
                    </span>
                  </span>
                </label>

                <select
                  value={row.category}
                  onChange={(event) => handleCategoryChange(row, event.target.value)}
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

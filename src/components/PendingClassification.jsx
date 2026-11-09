import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Tags, Wand2, Sparkles, CheckCheck, Loader2 } from 'lucide-react'
import { suggestCategory, UNCATEGORIZED_LABEL } from '../lib/quickParse'
import { descriptionSignature } from '../lib/statementImport'
import { readDescriptionPatterns, saveDescriptionPattern } from '../lib/descriptionPatterns'
import { classifyDescriptionsWithAI } from '../lib/aiClassify'
import { formatCurrency } from '../utils/format'
import { formatDateBR } from '../utils/date'
import { toast } from '../hooks/useToast'

// A fila é AGRUPADA por descrição: quem importou um extrato não decide
// 101 vezes — decide uma vez por lugar/pessoa ("DROGARIA SÃO PAULO",
// 6 lançamentos) e a classificação vale pro grupo inteiro, além de
// ensinar o padrão pras próximas importações.
function GroupRow({ group, categories, suggestion, suggestionSource, onClassify }) {
  const [selected, setSelected] = useState(suggestion || '')
  const [saving, setSaving] = useState(false)

  // Quando a sugestão (principalmente a da IA) chega depois da
  // montagem, ela pré-seleciona o seletor se a pessoa ainda não mexeu.
  useEffect(() => {
    if (suggestion) setSelected((current) => current || suggestion)
  }, [suggestion])

  const apply = async (category) => {
    if (!category || saving) return
    setSaving(true)
    try {
      await onClassify(group, category)
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{group.sample}</p>
        <p className="text-xs text-slate-400">
          {group.count} {group.count === 1 ? 'lançamento' : 'lançamentos'} • último em {formatDateBR(group.latestDate)} •{' '}
          <span className={group.type === 'income' ? 'text-emerald-300' : 'text-red-300'}>
            {group.type === 'income' ? '+' : '-'}{formatCurrency(group.total)}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {suggestion && (
          <button
            type="button"
            disabled={saving}
            onClick={() => apply(suggestion)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
              suggestionSource === 'ai'
                ? 'border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
            }`}
          >
            {suggestionSource === 'ai' ? <Sparkles size={12} /> : <Wand2 size={12} />}
            {suggestion}
            {suggestionSource === 'ai' && <span className="font-normal opacity-70">(IA)</span>}
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
          {saving ? '...' : group.count > 1 ? `Classificar ${group.count}` : 'Classificar'}
        </button>
      </div>
    </li>
  )
}

export function PendingClassification({ transactions = [], categories = [], learnedMap = null, onClassify, panelClass = '', focusSignal = 0 }) {
  const [patterns, setPatterns] = useState(() => readDescriptionPatterns())
  const [aiSuggestions, setAiSuggestions] = useState(() => new Map())
  const [aiLoading, setAiLoading] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [pulse, setPulse] = useState(false)
  const sectionRef = useRef(null)

  // Pós-importação guiada: quando o sinal muda, a fila rola pra vista e
  // pulsa — a pessoa cai direto no próximo passo, sem caçar na tela.
  useEffect(() => {
    if (!focusSignal) return
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setPulse(true)
    const timer = setTimeout(() => setPulse(false), 1800)
    return () => clearTimeout(timer)
  }, [focusSignal])

  const groups = useMemo(() => {
    const map = new Map()
    transactions.forEach((tx) => {
      const signature = descriptionSignature(tx.description) || tx.description
      const key = `${tx.type}|${signature}`
      const existing = map.get(key)
      if (existing) {
        existing.ids.push(tx.id)
        existing.count += 1
        existing.total += Math.abs(Number(tx.amount) || 0)
        if (tx.date > existing.latestDate) {
          existing.latestDate = tx.date
          existing.sample = tx.description
        }
      } else {
        map.set(key, {
          key,
          signature,
          type: tx.type,
          sample: tx.description,
          ids: [tx.id],
          count: 1,
          total: Math.abs(Number(tx.amount) || 0),
          latestDate: tx.date,
        })
      }
    })
    return [...map.values()].sort((a, b) => (b.count - a.count) || (b.total - a.total))
  }, [transactions])

  const suggestionFor = (group) => {
    const fromPattern = patterns[group.signature]
    if (fromPattern && categories.includes(fromPattern)) {
      return { category: fromPattern, source: 'pattern' }
    }
    const fromDictionary = suggestCategory(group.sample, { categories, learnedMap, type: group.type })
    if (fromDictionary) return { category: fromDictionary, source: 'dictionary' }
    const fromAI = aiSuggestions.get(group.key)
    if (fromAI) return { category: fromAI, source: 'ai' }
    return { category: null, source: null }
  }

  const enriched = useMemo(
    () => groups.map((group) => ({ group, ...suggestionFor(group) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, patterns, aiSuggestions, categories, learnedMap],
  )

  const unsuggested = enriched.filter((entry) => !entry.category)
  const aiSuggested = enriched.filter((entry) => entry.source === 'ai' && entry.category)

  const classifyGroup = async (group, category) => {
    try {
      const applied = await onClassify(group.ids, category)
      saveDescriptionPattern(group.signature, category)
      setPatterns(readDescriptionPatterns())
      toast.success(`${applied ?? group.count} ${group.count === 1 ? 'lançamento classificado' : 'lançamentos classificados'} como ${category}.`)
    } catch (classifyError) {
      toast.error(`Erro ao classificar: ${classifyError.message}`)
    }
  }

  const askAI = async () => {
    if (aiLoading || unsuggested.length === 0) return
    setAiLoading(true)
    try {
      const items = unsuggested.slice(0, 60).map((entry) => ({
        key: entry.group.key,
        description: entry.group.sample,
        type: entry.group.type,
      }))
      const result = await classifyDescriptionsWithAI(
        items,
        categories.filter((category) => category !== UNCATEGORIZED_LABEL),
      )
      if (result.size === 0) {
        toast.info('A IA não teve certeza sobre essas descrições. Vale classificar um de cada tipo — o padrão fica aprendido.')
      } else {
        setAiSuggestions((current) => new Map([...current, ...result]))
        toast.success(`A IA sugeriu categoria para ${result.size} ${result.size === 1 ? 'grupo' : 'grupos'}. Confira e aceite com um toque.`)
      }
    } catch (aiError) {
      toast.error(aiError.code === 'AI_NOT_CONFIGURED'
        ? 'A IA não está disponível agora — dá pra classificar pelos padrões, que também aprendem.'
        : `A IA não respondeu: ${aiError.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  const acceptAllAI = async () => {
    if (bulkSaving || aiSuggested.length === 0) return
    setBulkSaving(true)
    try {
      const byCategory = new Map()
      aiSuggested.forEach((entry) => {
        if (!byCategory.has(entry.category)) byCategory.set(entry.category, [])
        byCategory.get(entry.category).push(entry)
      })

      let totalApplied = 0
      for (const [category, entries] of byCategory) {
        const ids = entries.flatMap((entry) => entry.group.ids)
        const applied = await onClassify(ids, category)
        totalApplied += applied ?? ids.length
        entries.forEach((entry) => saveDescriptionPattern(entry.group.signature, category))
      }
      setPatterns(readDescriptionPatterns())
      setAiSuggestions(new Map())
      toast.success(`${totalApplied} lançamentos classificados com as sugestões da IA.`)
    } catch (bulkError) {
      toast.error(`Erro ao aceitar as sugestões: ${bulkError.message}`)
    } finally {
      setBulkSaving(false)
    }
  }

  if (transactions.length === 0) return null

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass} ${pulse ? 'ring-2 ring-amber-400/70' : ''}`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-400/10 p-1.5 text-amber-300">
            <Tags size={14} />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
            Classificar quando puder
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {aiSuggested.length > 0 && (
            <button
              type="button"
              disabled={bulkSaving}
              onClick={acceptAllAI}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
            >
              <CheckCheck size={13} />
              {bulkSaving ? 'Aplicando...' : `Aceitar ${aiSuggested.length} da IA`}
            </button>
          )}
          {unsuggested.length > 0 && (
            <button
              type="button"
              disabled={aiLoading}
              onClick={askAI}
              className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {aiLoading ? 'IA pensando...' : 'Classificar com IA'}
            </button>
          )}
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-400">
        Faltam <strong className="text-slate-200">{groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}</strong> ({transactions.length} lançamentos) — cada linha é uma descrição: classificou uma vez, vale pra todos e fica aprendido.
      </p>

      <ul className="space-y-2">
        {enriched.slice(0, 30).map(({ group, category, source }) => (
          <GroupRow
            key={group.key}
            group={group}
            categories={categories}
            suggestion={category}
            suggestionSource={source}
            onClassify={classifyGroup}
          />
        ))}
      </ul>
      {groups.length > 30 && (
        <p className="mt-2 text-xs text-slate-500">... e mais {groups.length - 30} grupos. Os maiores já estão aqui no topo.</p>
      )}
    </motion.section>
  )
}

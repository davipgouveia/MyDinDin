'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'

// Toast "Faixa superior" — conceito 3, escolhido pelo Davi em 2026-11-09.
// Uma faixa fina desce do topo (uma por vez, as demais esperam na fila),
// com ícone colorido por tipo e uma linha de progresso que mostra o tempo
// restante. Pensado primeiro pro celular: ocupa a largura com margens,
// respeita a área segura do topo e o texto quebra em até 2 linhas.
// Substitui a biblioteca sileo mantendo a MESMA API pública (toast.*,
// ToastProvider, toastMessages) — nenhum chamador precisou mudar.

const DEFAULT_DURATION = 3000

const TYPE_STYLE = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', bar: 'bg-emerald-400' },
  error: { icon: XCircle, color: 'text-rose-400', bar: 'bg-rose-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bar: 'bg-amber-400' },
  info: { icon: Info, color: 'text-cyan-400', bar: 'bg-cyan-400' },
  loading: { icon: Loader2, color: 'text-cyan-400', bar: 'bg-cyan-400' },
}

// --- mini-store fora do React (o toast é chamado de qualquer lugar) ---
let current = null
let queue = []
let nextId = 1
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function scheduleDismiss(item) {
  if (!item.duration) return
  item.timer = setTimeout(() => dismiss(item.id), item.duration)
}

function present(item) {
  current = item
  scheduleDismiss(item)
  emit()
}

function push(item) {
  const toastItem = { id: nextId, duration: DEFAULT_DURATION, ...item }
  nextId += 1
  if (current) queue.push(toastItem)
  else present(toastItem)
  return toastItem.id
}

function dismiss(id) {
  if (!id) {
    if (current?.timer) clearTimeout(current.timer)
    current = null
    queue = []
    emit()
    return
  }
  if (current && current.id === id) {
    if (current.timer) clearTimeout(current.timer)
    current = null
    const next = queue.shift()
    if (next) present(next)
    else emit()
    return
  }
  queue = queue.filter((item) => item.id !== id)
  emit()
}

function update(id, patch) {
  if (current && current.id === id) {
    if (current.timer) clearTimeout(current.timer)
    current = { ...current, ...patch }
    scheduleDismiss(current)
    emit()
    return
  }
  queue = queue.map((item) => (item.id === id ? { ...item, ...patch } : item))
  emit()
}

const toTitle = (message, fallback) => {
  if (typeof message === 'string') return message
  if (message && typeof message === 'object') {
    if (typeof message.title === 'string') return message.title
    if (typeof message.message === 'string') return message.message
  }
  return fallback
}

const resolvePromiseOption = (option, fallback) => {
  if (typeof option === 'function') {
    return (value) => {
      const resolved = option(value)
      return toTitle(resolved, fallback)
    }
  }
  if (typeof option === 'string') return () => option
  if (option && typeof option === 'object') return () => toTitle(option, fallback)
  return () => fallback
}

export const toast = {
  success: (message) => push({ type: 'success', title: toTitle(message, 'Operação realizada com sucesso!') }),
  error: (message) => push({ type: 'error', title: toTitle(message, 'Ocorreu um erro!'), duration: 4500 }),
  info: (message) => push({ type: 'info', title: toTitle(message, 'Informação') }),
  warning: (message) => push({ type: 'warning', title: toTitle(message, 'Atenção'), duration: 4000 }),
  loading: (message) => push({ type: 'loading', title: toTitle(message, 'Carregando...'), duration: null }),
  dismiss: (toastId) => dismiss(toastId),
  promise: (promise, messages = {}) => {
    const id = push({ type: 'loading', title: toTitle(messages.loading, 'Carregando...'), duration: null })
    const onSuccess = resolvePromiseOption(messages.success, 'Operação concluída com sucesso!')
    const onError = resolvePromiseOption(messages.error, 'Ocorreu um erro durante a operação.')

    promise.then(
      (value) => update(id, { type: 'success', title: onSuccess(value), duration: DEFAULT_DURATION }),
      (error) => update(id, { type: 'error', title: onError(error), duration: 4500 }),
    )

    return promise
  },
}

export function ToastProvider() {
  const { theme } = usePreferences()
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((tick) => tick + 1)
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])

  const isLight = theme === 'light'
  const style = current ? TYPE_STYLE[current.type] || TYPE_STYLE.info : null
  const Icon = style?.icon

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex justify-center sm:inset-x-0"
    >
      <AnimatePresence mode="wait">
        {current && Icon && (
          <motion.div
            key={current.id}
            role="status"
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl backdrop-blur ${
              isLight
                ? 'border-slate-200 bg-white/95 text-slate-800 shadow-slate-900/10'
                : 'border-slate-700/80 bg-slate-900/95 text-slate-100 shadow-black/50'
            }`}
          >
            <div className="flex items-center gap-2.5 px-4 py-3">
              <Icon
                size={19}
                className={`shrink-0 ${style.color} ${current.type === 'loading' ? 'animate-spin' : ''}`}
              />
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug line-clamp-2">{current.title}</p>
              <button
                type="button"
                onClick={() => dismiss(current.id)}
                aria-label="Fechar aviso"
                className={`shrink-0 rounded-full p-1 transition ${
                  isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <X size={15} />
              </button>
            </div>
            {current.duration ? (
              <motion.div
                key={`bar-${current.id}`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: current.duration / 1000, ease: 'linear' }}
                className={`absolute inset-x-0 bottom-0 h-[3px] origin-left ${style.bar}`}
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const toastMessages = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  loading: (message) => toast.loading(message),
  promise: (promise, messages) => toast.promise(promise, messages),
  info: (message) => toast.info(message),
  warning: (message) => toast.warning(message),
  dismiss: (toastId) => toast.dismiss(toastId),
  dismissAll: () => toast.dismiss(),
}

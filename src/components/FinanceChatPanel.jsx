'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, User2, MessageCircleQuestion, Trash2 } from 'lucide-react'
import { buildFinanceChatReply } from '../lib/financeChatBrain'
import { usePreferences } from '../context/PreferencesContext'

const STORAGE_KEY = 'mydindin_ai_chat_history'

const createWelcomeMessage = (t) => ({
  id: `assistant-${Date.now()}`,
  role: 'assistant',
  text: t('chatWelcome'),
  meta: {
    intent: 'welcome',
  },
})

export function FinanceChatPanel({ insights = {}, recommendations = [], budgets = [], transactions = [] }) {
  const { theme, accent, t } = usePreferences()
  const [messages, setMessages] = useState(() => [createWelcomeMessage(t)])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const isLight = theme === 'light'

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length) {
        setMessages(parsed)
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-24)))
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const accentClass = useMemo(() => {
    if (accent === 'emerald') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
    if (accent === 'amber') return 'border-amber-500/25 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
    return 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15'
  }, [accent])

  const panelClass = isLight ? 'border-slate-200 bg-white/90 text-slate-900' : 'border-slate-800 bg-slate-950/70 text-white'
  const bubbleUserClass = isLight ? 'border-slate-200 bg-slate-100 text-slate-900' : 'border-slate-700 bg-slate-800/80 text-white'
  const bubbleAssistantClass = isLight ? 'border-cyan-200 bg-cyan-50 text-slate-900' : 'border-cyan-500/20 bg-cyan-500/10 text-slate-100'

  const quickPrompts = useMemo(() => {
    const prompts = [
      t('chatPromptSummary'),
      t('chatPromptSpending'),
      t('chatPromptBudget'),
      t('chatPromptForecast'),
      t('chatPromptSeasonality'),
    ]
    return prompts.filter(Boolean)
  }, [t])

  const sendMessage = async (text) => {
    const normalized = text.trim()
    if (!normalized || isTyping) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: normalized,
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsTyping(true)

    window.setTimeout(() => {
      const reply = buildFinanceChatReply({
        message: normalized,
        insights,
        recommendations,
        budgets,
        transactions,
      })

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: reply.reply,
          meta: {
            intent: reply.intent,
            confidence: reply.confidence,
            followUps: reply.followUps,
          },
        },
      ])
      setIsTyping(false)
    }, 450)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  const handlePromptClick = (prompt) => {
    sendMessage(prompt)
  }

  const handleClearChat = () => {
    setMessages([createWelcomeMessage(t)])
    window.localStorage.removeItem(STORAGE_KEY)
  }

  const latestSummary = [
    { label: 'Saldo', value: insights.balance ?? 0 },
    { label: 'Gastos', value: insights.totalExpenses ?? 0 },
    { label: 'Poupança', value: insights.savingsRate ?? 0, isPercent: true },
  ]

  return (
    <section className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">{t('chatTitle')}</h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{t('chatSubtitle')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-500/40 hover:text-white"
        >
          <Trash2 size={14} />
          {t('chatClear')}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {latestSummary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {item.isPercent ? `${Number(item.value || 0).toFixed(1)}%` : `${Number(item.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handlePromptClick(prompt)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${accentClass}`}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Bot size={16} />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-6 ${message.role === 'user' ? bubbleUserClass : bubbleAssistantClass}`}>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] opacity-80">
                  {message.role === 'user' ? <User2 size={12} /> : <Sparkles size={12} />}
                  <span>{message.role === 'user' ? t('chatYou') : t('chatAssistant')}</span>
                </div>
                <p className="mt-1 whitespace-pre-line">{message.text}</p>
                {message.meta?.followUps?.length > 0 && message.role === 'assistant' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.meta.followUps.slice(0, 3).map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        onClick={() => handlePromptClick(followUp)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${accentClass}`}
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/90 text-slate-200">
                  <User2 size={16} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Bot size={16} />
            </div>
            <div className={`rounded-2xl border px-3 py-2 text-sm ${bubbleAssistantClass}`}>
              {t('chatTyping')}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('chatPlaceholder')}
          className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
        />
        <button
          type="submit"
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${accentClass}`}
        >
          <Send size={16} />
          {t('chatSend')}
        </button>
      </form>

      <div className={`mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        <MessageCircleQuestion size={12} />
        <span>{t('chatModelTag')}</span>
        {typeof insights.trendChangePercent === 'number' && (
          <span>• {t('chatIntentTag')}</span>
        )}
      </div>
    </section>
  )
}
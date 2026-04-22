'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '../context/ChatContext'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, User2, MessageCircleQuestion, Trash2 } from 'lucide-react'
import { buildFinanceChatReply } from '../lib/financeChatBrain'
import { fetchGeminiChatReply } from '../lib/geminiApi'
import { usePreferences } from '../context/PreferencesContext'
import { useFinancialBudget } from '../hooks/useFinancialAI'
import { askGemini } from '../lib/geminiAgent'

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
  const { messages, setMessages } = useChat()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const isLight = theme === 'light'
  const { addBudget } = useFinancialBudget()
  const { addCustomCategory } = require('../context/TransactionCategoryContext').useTransactionCategory()

  // Remove persistência localStorage, pois agora está no contexto global
  useEffect(() => {
    if (!messages.length) {
      setMessages([createWelcomeMessage(t)])
    }
    // eslint-disable-next-line
  }, [])



  // Auto-scroll apenas no container de mensagens do chat
  useEffect(() => {
    // Busca o container de overflow do chat
    const chatContainer = bottomRef.current?.closest('.overflow-y-auto')
    if (chatContainer && bottomRef.current) {
      // Usa setTimeout para garantir que o DOM já atualizou
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }, 0)
    }
  }, [messages])

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

  // Função utilitária simples para Markdown básico (negrito, itálico, links)
  function renderMarkdown(text) {
    if (!text) return null
    let html = text
    // Negrito **texto**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Itálico *texto*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links [texto](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-cyan-400 hover:text-cyan-300">$1</a>')
    // Quebra de linha
    html = html.replace(/\n/g, '<br />')
    return <span dangerouslySetInnerHTML={{ __html: html }} />
  }

  const sendMessage = async (text) => {
    const normalized = text.trim()
    if (!normalized || isTyping) return

    // Verifica se a última mensagem era de permissão de categoria
    const lastMsg = messages[messages.length - 1]
    if (
      lastMsg &&
      lastMsg.meta?.intent === 'category_permission' &&
      ['sim', 'Sim', 'SIM', 's', 'S'].includes(normalized)
    ) {
      // Executa a criação da categoria
      const { name, type } = lastMsg.meta.pendingCategory
      addCustomCategory({ name }, type)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: `Categoria "${name}" do tipo ${type === 'income' ? 'receita' : 'despesa'} criada com sucesso! 🏷️`,
          meta: { intent: 'category_created', category: { name, type } }
        },
      ])
      setInput('')
      setIsTyping(false)
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: normalized,
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsTyping(true)

    // ==========================================
    // INJEÇÃO DE CONTEXTO DINÂMICO (System Prompt)
    // ==========================================
    const topCategory = insights.categoryExpenses 
      ? Object.entries(insights.categoryExpenses).sort((a, b) => b[1] - a[1])[0] 
      : null;

    const systemPrompt = `
      Você é o DinDinMind, um assistente financeiro inteligente e direto ao ponto.
      Use emojis.

      DADOS ATUAIS DO USUÁRIO NESTE MÊS:
      - Saldo: R$ ${insights.balance || 0}
      - Despesas totais: R$ ${insights.totalExpenses || 0}
      - Receitas totais: R$ ${insights.totalIncome || 0}
      ${topCategory ? `- Categoria com maior gasto: ${topCategory[0]} (R$ ${topCategory[1]})` : ''}
      - Taxa de poupança: ${insights.savingsRate ? insights.savingsRate.toFixed(1) : 0}%

      REGRAS IMPORTANTES:
      - Se o usuário pedir para criar, adicionar ou definir um orçamento, use a ferramenta 'add_budget'.
      - Se o usuário pedir para criar uma categoria, use a ferramenta 'add_category', mas sempre peça permissão antes de executar.
      - Se o usuário pedir para alterar configurações do site, sempre peça permissão antes de executar.
      - Nunca execute ações sensíveis sem confirmação do usuário.
    `;

    try {
      // Chama o Gemini passando a mensagem e o contexto atualizado
      const response = await askGemini(normalized, systemPrompt);

      if (response.isFunction && response.functionCall.name === 'add_budget') {
        const { category, limit } = response.functionCall.args;
        await addBudget(category, limit, 'mensal');
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Prontinho! Acabei de criar e salvar um orçamento de R$ ${limit} para a categoria "${category}". 🎯`,
            meta: { intent: 'budget_created' }
          },
        ])
      } else if (response.isFunction && response.functionCall.name === 'add_category') {
        const { name, type } = response.functionCall.args;
        // IA pede permissão ao usuário antes de criar
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Posso criar a categoria "${name}" do tipo ${type === 'income' ? 'receita' : 'despesa'} para você? Responda "sim" para confirmar ou "não" para cancelar.`,
            meta: { intent: 'category_permission', pendingCategory: { name, type } }
          },
        ])
      } else {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: response.text,
            meta: { intent: 'chat' }
          },
        ])
      }
    } catch (error) {
      console.error("Erro na IA:", error);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: "Ops, minha conexão falhou por um instante. Pode repetir?",
        },
      ])
    } finally {
      setIsTyping(false)
    }
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
                {message.role === 'assistant'
                  ? <p className="mt-1 whitespace-pre-line">{renderMarkdown(message.text)}</p>
                  : <p className="mt-1 whitespace-pre-line">{message.text}</p>
                }
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
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '../context/ChatContext'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, User2, MessageCircleQuestion, Trash2 } from 'lucide-react'
import { buildFinanceChatReply, buildImprovementSuggestions } from '../lib/financeChatBrain'
import { usePreferences } from '../context/PreferencesContext'
import { useFinancialBudget } from '../hooks/useFinancialAI'
import { askGemini } from '../lib/geminiAgent'
import { ConfirmDialog } from './ConfirmDialog'
import { useFinance } from '../context/FinanceContext'
import * as shop from '../lib/shopping'
import { formatCurrency } from '../utils/format'

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
  const [confirmClear, setConfirmClear] = useState(false)
  const bottomRef = useRef(null)
  const isLight = theme === 'light'
  const { addBudget } = useFinancialBudget()
  const { user: financeUser, profile: financeProfile } = useFinance()
  const { addCustomCategory } = require('../context/TransactionCategoryContext').useTransactionCategory()

  // O histórico vive no ChatContext, que persiste no aparelho
  // (localStorage). Aqui só semeamos a saudação quando está vazio.
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
      t('chatPromptImprove'),
      t('chatPromptBudget'),
      t('chatPromptForecast'),
      t('chatPromptSeasonality'),
    ]
    return prompts.filter(Boolean)
  }, [t])

  // Markdown básico (negrito, itálico, links) com escape de HTML ANTES
  // das substituições — sem isso, qualquer HTML digitado na conversa
  // era injetado na página (XSS).
  function renderMarkdown(text) {
    if (!text) return null
    let html = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
    // Negrito **texto**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Itálico *texto*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links [texto](url) — só http/https viram link; o resto vira texto puro
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, label, url) => {
      const href = String(url).trim()
      if (!/^https?:\/\//i.test(href)) return label
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="underline text-cyan-400 hover:text-cyan-300">${label}</a>`
    })
    // Quebra de linha
    html = html.replace(/\n/g, '<br />')
    return <span dangerouslySetInnerHTML={{ __html: html }} />
  }

  const sendMessage = async (text) => {
    const normalized = text.trim()
    if (!normalized || isTyping) return

    // Verifica se a última mensagem era de permissão de categoria
    const lastMsg = messages[messages.length - 1]

    // Resposta que NAO e "sim" nao pode fazer a permissao evaporar em
    // silencio: avisa que a criacao foi cancelada (e, se a pessoa fez
    // outra pergunta, ela segue o fluxo normal logo abaixo).
    if (
      lastMsg &&
      lastMsg.meta?.intent === 'category_permission' &&
      !['sim', 'Sim', 'SIM', 's', 'S'].includes(normalized)
    ) {
      const pendingName = lastMsg.meta.pendingCategory?.name || 'nova categoria'
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: `Beleza, cancelei a criação da categoria "${pendingName}". 👍`,
          meta: { intent: 'category_cancelled' },
        },
      ])

      if (['não', 'nao', 'n', 'cancelar', 'deixa', 'não quero', 'nao quero'].includes(normalized.toLowerCase())) {
        setInput('')
        return
      }
    }

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
    const topCategories = insights.categoryExpenses
      ? Object.entries(insights.categoryExpenses).sort((a, b) => b[1] - a[1]).slice(0, 3)
      : [];
    const budgetLines = (budgets || []).map((budget) =>
      `- Orçamento ${budget.category}: limite R$ ${budget.limit || 0}, gasto R$ ${budget.spent || 0} (${budget.status})`)
    const suggestionLines = buildImprovementSuggestions({ insights, budgets, transactions })
    const recommendationLines = (recommendations || []).slice(0, 3).map((item) => `- ${item.title}: ${item.description}`)

    const systemPrompt = `
      Você é o DinDinMind, um consultor financeiro pessoal que CONVERSA com o usuário e SUGERE MELHORIAS práticas para as finanças dele.
      Fale em português brasileiro, de forma natural, acolhedora e direta. Use emojis com moderação.
      Suas respostas devem se basear SOMENTE nos dados abaixo — nunca invente números.
      Sempre que fizer sentido, termine a resposta com UMA sugestão prática e concreta de melhoria, com o impacto estimado em reais (ex.: "cortar 20% do delivery libera cerca de R$ 180/mês").
      Responda em até 4 parágrafos curtos, sem juridiquês e sem prometer rentabilidade.

      DADOS ATUAIS DO USUÁRIO NESTE MÊS:
      - Saldo: R$ ${insights.balance || 0}
      - Despesas totais: R$ ${insights.totalExpenses || 0}
      - Receitas totais: R$ ${insights.totalIncome || 0}
      ${topCategories.map(([name, value]) => `- Gasto em ${name}: R$ ${value}`).join('\n      ')}
      - Taxa de poupança: ${insights.savingsRate ? insights.savingsRate.toFixed(1) : 0}%
      ${insights.projectedMonthExpense ? `- Projeção de gastos no fechamento do mês: R$ ${Math.round(insights.projectedMonthExpense)}` : ''}
      ${budgetLines.length ? `\n      ORÇAMENTOS:\n      ${budgetLines.join('\n      ')}` : ''}
      ${suggestionLines.length ? `\n      SUGESTÕES DE MELHORIA CALCULADAS DOS DADOS (use como base, com suas palavras):\n      ${suggestionLines.slice(0, 3).map((text) => `- ${text}`).join('\n      ')}` : ''}
      ${recommendationLines.length ? `\n      ALERTAS DO SISTEMA:\n      ${recommendationLines.join('\n      ')}` : ''}

      REGRAS IMPORTANTES:
      - Se o usuário pedir para criar, adicionar ou definir um orçamento, use a ferramenta 'add_budget'.
      - Se o usuário pedir para criar uma categoria, use a ferramenta 'add_category', mas sempre peça permissão antes de executar.
      - Se o usuário pedir para alterar configurações do site, sempre peça permissão antes de executar.
      - Nunca execute ações sensíveis sem confirmação do usuário.
      - MÓDULO COMPRAS (lista e compras da casa): para adicionar item à lista de compras use 'add_to_shopping_list'; para registrar uma compra já feita (com loja, itens e preços) use 'register_purchase'; para saber o que está acabando use 'get_running_out'; para preço de um produto ou loja mais barata use 'get_product_price'; para ver a lista de compras use 'get_shopping_list'. Se faltarem preços ou a loja numa compra, pergunte antes de registrar.
    `;

    try {
      // Chama a IA pela rota de servidor; se estiver indisponível,
      // responde com o cérebro local (regras) em vez de travar o chat.
      let response
      try {
        response = await askGemini(normalized, systemPrompt);
      } catch (aiError) {
        console.warn('IA indisponível, usando análise local:', aiError)
        const localReply = buildFinanceChatReply({ message: normalized, insights, recommendations, budgets, transactions })
        response = {
          isFunction: false,
          text: typeof localReply === 'string' ? localReply : (localReply?.reply || 'Não consegui analisar agora. Pode repetir?'),
          meta: typeof localReply === 'object' && localReply
            ? { intent: localReply.intent, followUps: localReply.followUps || [] }
            : { intent: 'chat' },
        }
      }

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
      } else if (response.isFunction && ['add_to_shopping_list', 'register_purchase', 'get_running_out', 'get_product_price', 'get_shopping_list'].includes(response.functionCall.name)) {
        // Ferramentas do módulo Compras: executam contra os dados reais
        // (Supabase, via camada de dados) e a resposta é montada aqui,
        // com os números de verdade — o modelo não inventa valores.
        const groupId = financeProfile?.group_id
        let text
        try {
          if (!groupId || !financeUser) throw new Error('Sessão não identificada.')
          const fn = response.functionCall.name
          const args = response.functionCall.args || {}
          if (fn === 'add_to_shopping_list') {
            await shop.addListItem(groupId, financeUser, { name: args.name, quantity: Number(args.quantity) || 1 })
            text = `Prontinho! Adicionei "${args.name}"${args.quantity ? ` (× ${args.quantity})` : ''} à lista de compras da casa. 🛒`
          } else if (fn === 'register_purchase') {
            const { purchase } = await shop.createPurchase(groupId, financeUser, financeProfile, {
              store: args.store || null,
              items: (args.items || []).map((i) => ({
                product: i.product,
                quantity: Number(i.quantity) || 1,
                unit_price: i.unit_price != null ? Number(i.unit_price) : null,
              })),
              finance: { categoryName: 'Mercado' },
            })
            const total = shop.purchaseTotal(purchase)
            text = `Compra registrada${args.store ? ` no ${args.store}` : ''}: ${formatCurrency(total)}. Os itens saíram da lista e a despesa entrou nas finanças. 🧾`
          } else if (fn === 'get_running_out') {
            const forecasts = await shop.getForecast(groupId)
            const urgent = forecasts.filter((f) => f.forecast.status === 'acabou' || f.forecast.status === 'acabando')
            text = urgent.length
              ? `Olho no estoque! 👀\n${urgent.map((f) => `- ${f.product.name}: ${f.forecast.status === 'acabou' ? 'acabou' : `acaba em ~${Math.ceil(f.forecast.days_left)} dias`}`).join('\n')}\nQuer que eu jogue tudo na lista de compras?`
              : 'Nada acabando por aqui — o estoque está tranquilo. 😌'
          } else if (fn === 'get_product_price') {
            const products = await shop.listProducts(groupId)
            const product = products.find((p) => p.name_norm === shop.nameNorm(args.product)) || products.find((p) => p.name_norm.includes(shop.nameNorm(args.product)))
            if (!product) {
              text = `Ainda não tenho compras registradas de "${args.product}", então não sei o preço. Quando registrar a primeira compra, eu passo a acompanhar.`
            } else {
              const prices = await shop.productPrices(groupId, product.id)
              text = prices.cheapest
                ? `O ${product.name} está mais barato no ${prices.cheapest.store.name}: ${formatCurrency(prices.cheapest.last_price)}/${product.unit || 'un'} (última compra). ${prices.by_store.length > 1 ? `Outras lojas: ${prices.by_store.slice(1).map((s) => `${s.store.name} ${formatCurrency(s.last_price)}`).join(', ')}.` : ''}`
                : `Ainda não há preço registrado para ${product.name}.`
            }
          } else {
            const pending = await shop.listShoppingList(groupId, { includeDone: false })
            text = pending.length
              ? `Sua lista de compras tem ${pending.length} itens pendentes:\n${pending.map((i) => `- ${i.name} × ${i.quantity}`).join('\n')}`
              : 'A lista de compras está vazia. Quer adicionar algo?'
          }
        } catch (shopError) {
          console.error('Erro nas ferramentas de compras:', shopError)
          text = 'Tive um problema ao mexer nas compras agora. Tenta de novo em um instante?'
        }
        setMessages((current) => [
          ...current,
          { id: `assistant-${Date.now()}`, role: 'assistant', text, meta: { intent: 'shopping_tool' } },
        ])
      } else {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: response.text,
            meta: response.meta || { intent: 'chat' }
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
          onClick={() => setConfirmClear(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-500/40 hover:text-white"
        >
          <Trash2 size={14} />
          {t('chatClear')}
        </button>
      </div>

      <ConfirmDialog
        open={confirmClear}
        danger
        title="Limpar a conversa?"
        message="Todo o histórico com o DinDinMind neste aparelho será apagado. Os seus lançamentos não são afetados."
        confirmLabel="Limpar"
        onConfirm={() => {
          handleClearChat()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />

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
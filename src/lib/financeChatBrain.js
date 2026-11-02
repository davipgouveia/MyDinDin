import { formatCurrency } from '../utils/format'

const trainingExamples = {
  summary: [
    'como esta meu mes',
    'como esta o meu mes',
    'como vai meu mes',
    'me mostra como esta meu mes',
    'me mostre o resumo das finanças',
    'qual meu saldo hoje',
    'quero ver minhas receitas e despesas',
    'resuma minha situação financeira',
  ],
  spending: [
    'onde estou gastando mais',
    'quais categorias pesam mais',
    'me mostra meus gastos',
    'quero entender meus gastos diários',
    'qual foi meu maior gasto',
  ],
  savings: [
    'como está minha poupança',
    'estou guardando dinheiro',
    'quero economizar mais',
    'minha taxa de poupança está boa',
    'como posso poupar melhor',
  ],
  budget: [
    'meu orçamento vai estourar',
    'como estão meus orçamentos',
    'quero revisar os limites',
    'qual orçamento está alto',
    'me avise sobre orçamento',
  ],
  forecast: [
    'preveja meus gastos',
    'o que vai acontecer no fim do mes',
    'quero uma previsão financeira',
    'me diga a tendência deste mes',
    'vou fechar no vermelho',
  ],
  seasonality: [
    'qual dia da semana gasto mais',
    'tem sazonalidade nos meus gastos',
    'analisar padrão semanal',
    'quais dias pesam mais',
    'me mostre a sazonalidade',
  ],
  categories: [
    'qual categoria pesa mais',
    'me ajude com as categorias',
    'como estão meus gastos por categoria',
    'quero analisar por categoria',
    'qual categoria melhorar',
  ],
  improve: [
    'como posso melhorar minhas financas',
    'onde posso economizar',
    'me de dicas pra economizar',
    'como gastar menos',
    'quero melhorar minha vida financeira',
    'como sobrar dinheiro no fim do mes',
    'o que posso fazer pra melhorar',
    'me ajuda a economizar dinheiro',
  ],
  compare: [
    'comparado ao mes passado',
    'como foi o mes passado',
    'evolucao dos meus gastos',
    'gastei mais que o mes passado',
    'comparar este mes com o anterior',
    'meus gastos aumentaram',
  ],
  greeting: [
    'oi',
    'ola',
    'bom dia',
    'boa tarde',
    'hello',
  ],
  help: [
    'o que voce pode fazer',
    'me ajuda',
    'como funciona',
    'quais perguntas posso fazer',
    'o que voce sabe',
  ],
}

const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'um', 'uma', 'para', 'por', 'com', 'me', 'minha', 'meu', 'meus', 'minhas', 'no', 'na', 'nos', 'nas', 'que', 'como', 'qual', 'quais'])

const tokenize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !stopWords.has(token))

const model = (() => {
  const vocab = new Set()
  const intentTotals = {}
  const intentWordCounts = {}
  const intentDocCounts = {}
  let totalDocs = 0

  Object.entries(trainingExamples).forEach(([intent, examples]) => {
    intentDocCounts[intent] = examples.length
    totalDocs += examples.length
    intentWordCounts[intent] = {}
    intentTotals[intent] = 0

    examples.forEach((example) => {
      tokenize(example).forEach((token) => {
        vocab.add(token)
        intentWordCounts[intent][token] = (intentWordCounts[intent][token] || 0) + 1
        intentTotals[intent] += 1
      })
    })
  })

  return { vocab, intentTotals, intentWordCounts, intentDocCounts, totalDocs }
})()

export function classifyFinanceIntent(message) {
  const tokens = tokenize(message)
  if (!tokens.length) {
    return { intent: 'help', confidence: 0.25 }
  }

  const intents = Object.keys(trainingExamples)
  const scores = intents.map((intent) => {
    const prior = Math.log((model.intentDocCounts[intent] || 1) / model.totalDocs)
    const totalWords = model.intentTotals[intent] || 0
    const vocabSize = model.vocab.size || 1

    const tokenScore = tokens.reduce((sum, token) => {
      const count = model.intentWordCounts[intent][token] || 0
      const likelihood = (count + 1) / (totalWords + vocabSize)
      return sum + Math.log(likelihood)
    }, 0)

    return { intent, score: prior + tokenScore }
  })

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  const second = scores[1]
  const confidence = Number.isFinite(best.score - (second?.score ?? best.score))
    ? 1 / (1 + Math.exp(-(best.score - (second?.score ?? best.score))))
    : 0.5

  return {
    intent: best.intent,
    confidence: Number(confidence.toFixed(2)),
  }
}

const pickTopCategory = (categoryExpenses = {}) =>
  Object.entries(categoryExpenses).sort(([, left], [, right]) => right - left)[0]

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const getWeekdayExpenses = (transactions = []) => {
  const weekdayExpenses = Array.from({ length: 7 }, () => 0)

  transactions.forEach((transaction) => {
    if (transaction.type !== 'expense') return

    const date = new Date(transaction.createdAt || transaction.created_at || transaction.date || transaction.transaction_date)
    if (Number.isNaN(date.getTime())) return

    const weekdayIndex = date.getDay()
    weekdayExpenses[weekdayIndex] += Math.abs(Number(transaction.amount) || 0)
  })

  return weekdayExpenses.map((value, index) => ({
    name: WEEKDAY_NAMES[index],
    value,
  }))
}

const formatTrend = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value === 0) return null
  return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`
}

const txDate = (t) => {
  const date = new Date(t.createdAt || t.created_at || t.date || t.transaction_date)
  return Number.isNaN(date.getTime()) ? null : date
}

const txAmount = (t) => Math.abs(Number(t.amount) || 0)

// Compara o mês atual com o mês anterior a partir das transações cruas.
const getMonthComparison = (transactions = []) => {
  const now = new Date()
  const curStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const out = {
    curExpenses: 0, prevExpenses: 0, curIncome: 0, prevIncome: 0,
    curByCategory: {}, prevByCategory: {},
  }
  transactions.forEach((t) => {
    const date = txDate(t)
    if (!date) return
    const bucket = date >= curStart ? 'cur' : date >= prevStart ? 'prev' : null
    if (!bucket) return
    const category = t.category || 'outros'
    if (t.type === 'expense') {
      out[`${bucket}Expenses`] += txAmount(t)
      out[`${bucket}ByCategory`][category] = (out[`${bucket}ByCategory`][category] || 0) + txAmount(t)
    } else {
      out[`${bucket}Income`] += Number(t.amount) || 0
    }
  })
  return out
}

// Despesas recorrentes: mesma descrição 3+ vezes com valores parecidos.
const detectRecurring = (transactions = []) => {
  const groups = new Map()
  transactions.forEach((t) => {
    if (t.type !== 'expense') return
    const key = String(t.description || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[0-9]/g, '').replace(/\s+/g, ' ').trim()
    if (key.length < 3) return
    if (!groups.has(key)) groups.set(key, { name: t.description, amounts: [], dates: [] })
    const group = groups.get(key)
    group.amounts.push(txAmount(t))
    const date = txDate(t)
    if (date) group.dates.push(date)
  })

  const recurring = []
  groups.forEach((group) => {
    if (group.amounts.length < 3) return
    const sorted = [...group.amounts].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    if (!median) return
    const similar = group.amounts.filter((v) => Math.abs(v - median) <= median * 0.25)
    if (similar.length < 3) return
    const dates = group.dates.sort((a, b) => a - b)
    const spanMonths = dates.length > 1
      ? Math.max(1, (dates[dates.length - 1] - dates[0]) / (30 * 24 * 3600 * 1000))
      : 1
    const perMonth = Math.max(1, Math.round(similar.length / spanMonths))
    recurring.push({ name: group.name, monthly: median * perMonth, count: similar.length })
  })
  return recurring.sort((a, b) => b.monthly - a.monthly)
}

// Motor de sugestões de melhoria: tudo calculado dos dados reais do
// usuário, com impacto estimado em R$/mês. É o coração do "sugerir
// melhorias" — funciona 100% local, sem nenhuma API.
export function buildImprovementSuggestions({ insights = {}, budgets = [], transactions = [] } = {}) {
  const suggestions = []
  const totalExpenses = insights.totalExpenses || 0
  const totalIncome = insights.totalIncome || 0
  const balance = insights.balance ?? totalIncome - totalExpenses
  const savingsRate = insights.savingsRate || 0

  const rankedCategories = Object.entries(insights.categoryExpenses || {})
    .sort(([, a], [, b]) => b - a)

  if (balance < 0 && rankedCategories.length >= 2) {
    const cutTop2 = (rankedCategories[0][1] + rankedCategories[1][1]) * 0.25
    suggestions.push({
      impact: Math.abs(balance),
      text: `Você está ${formatCurrency(Math.abs(balance))} no vermelho neste mês. Um corte de 25% nas duas maiores categorias (${rankedCategories[0][0]} e ${rankedCategories[1][0]}) liberaria cerca de ${formatCurrency(cutTop2)} — ${cutTop2 >= Math.abs(balance) ? 'o suficiente pra zerar o déficit.' : 'um bom começo pra fechar essa conta.'}`,
    })
  }

  if (rankedCategories.length && totalExpenses > 0) {
    const [topName, topValue] = rankedCategories[0]
    const share = (topValue / totalExpenses) * 100
    if (share >= 25) {
      suggestions.push({
        impact: topValue * 0.2,
        text: `${topName} concentra ${share.toFixed(0)}% dos seus gastos (${formatCurrency(topValue)}). Reduzir 20% aí libera ${formatCurrency(topValue * 0.2)} por mês — ${formatCurrency(topValue * 0.2 * 12)} em um ano.`,
      })
    }
    if (rankedCategories.length >= 2) {
      const [secondName, secondValue] = rankedCategories[1]
      if (secondValue >= totalExpenses * 0.15) {
        suggestions.push({
          impact: secondValue * 0.15,
          text: `${secondName} é sua segunda maior frente (${formatCurrency(secondValue)}). Um enxugamento de 15% rende ${formatCurrency(secondValue * 0.15)} por mês.`,
        })
      }
    }
  }

  if (totalIncome > 0 && savingsRate < 20) {
    const gap = totalIncome * 0.2 - Math.max(balance, 0)
    if (gap > 0) {
      suggestions.push({
        impact: gap,
        text: `Sua poupança está em ${savingsRate.toFixed(1)}%. Pra chegar aos 20% recomendados, faltam ${formatCurrency(gap)} neste mês — dá pra buscar esse valor cortando um pouco das suas maiores categorias.`,
      })
    }
  }

  if (insights.projectedMonthExpense && totalIncome > 0 && insights.projectedMonthExpense > totalIncome) {
    const remainingDays = Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())
    const excess = insights.projectedMonthExpense - totalIncome
    suggestions.push({
      impact: excess,
      text: `No ritmo atual, o mês fecha ${formatCurrency(excess)} acima da sua renda. Cortar ${formatCurrency(excess / remainingDays)} por dia nos próximos ${remainingDays} dias evita o estouro.`,
    })
  }

  const exceeded = budgets.filter((b) => b.status === 'exceeded')
  exceeded.slice(0, 2).forEach((budget) => {
    const over = (budget.spent || 0) - (budget.limit || 0)
    if (over > 0) {
      suggestions.push({
        impact: over,
        text: `O orçamento de ${budget.category} já estourou em ${formatCurrency(over)} (limite de ${formatCurrency(budget.limit || 0)}). Vale pausar gastos novos nessa categoria até o mês virar.`,
      })
    }
  })

  const recurring = detectRecurring(transactions)
  if (recurring.length) {
    const recurringTotal = recurring.reduce((sum, item) => sum + item.monthly, 0)
    if (recurringTotal >= 50) {
      const names = recurring.slice(0, 3).map((item) => item.name).join(', ')
      suggestions.push({
        impact: recurringTotal * 0.3,
        text: `Suas despesas recorrentes (${names}) somam cerca de ${formatCurrency(recurringTotal)} por mês. Revisar assinaturas e serviços que você quase não usa pode recuperar uns ${formatCurrency(recurringTotal * 0.3)} disso.`,
      })
    }
  }

  return suggestions
    .sort((a, b) => b.impact - a.impact)
    .map((suggestion) => suggestion.text)
}

const STANDARD_CATEGORIES = ['alimentacao', 'transporte', 'saude', 'educacao', 'lazer', 'contas', 'shopping', 'moradia', 'mercado', 'delivery', 'assinaturas', 'vestuario', 'outros']

const normalizeText = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

// Detecta se a mensagem cita uma categoria conhecida ("quanto gastei
// com alimentação?") e devolve a chave da categoria.
const findCategoryInMessage = (message, categoryExpenses = {}) => {
  const normalized = normalizeText(message)
  const tokens = new Set(normalized.split(/[^a-z0-9]+/).filter(Boolean))
  const candidates = Array.from(new Set([...Object.keys(categoryExpenses), ...STANDARD_CATEGORIES]))
  return candidates.find((category) => tokens.has(normalizeText(category))) || null
}

export function buildFinanceChatReply({ message, insights = {}, recommendations = [], budgets = [], transactions = [] }) {
  const { intent, confidence } = classifyFinanceIntent(message)
  const topCategory = pickTopCategory(insights.categoryExpenses)
  const weekdayExpenses = getWeekdayExpenses(transactions)
  const activeBudgets = budgets.length ? budgets : []
  const overBudget = activeBudgets.filter((budget) => budget.status === 'exceeded')
  const warningBudgets = activeBudgets.filter((budget) => budget.status === 'warning')
  const latestTransaction = transactions[0]
  const trend = formatTrend(insights.trendChangePercent)
  const suggestions = buildImprovementSuggestions({ insights, budgets, transactions })
  const monthComparison = getMonthComparison(transactions)
  const mentionedCategory = findCategoryInMessage(message, insights.categoryExpenses)
  const biggestExpense = transactions
    .filter((t) => t.type === 'expense')
    .sort((a, b) => txAmount(b) - txAmount(a))[0]

  const baseSummary = [
    `Saldo atual: ${formatCurrency(insights.balance || 0)}.`,
    `Renda do mês: ${formatCurrency(insights.totalIncome || 0)} e gastos: ${formatCurrency(insights.totalExpenses || 0)}.`,
  ]

  const intros = [
    'Boa pergunta.',
    'Perfeito, vamos olhar isso juntos.',
    'Ótimo ponto.',
    'Bora analisar com calma.',
  ]
  const closings = [
    'Se quiser, eu detalho por categoria em seguida.',
    'Posso te mostrar o próximo passo mais seguro agora.',
    'Se fizer sentido, eu monto um plano curto para os próximos dias.',
    'Se preferir, eu simplifico em três ações práticas.',
  ]
  const pick = (list) => list[Math.floor(Math.random() * list.length)]
  const makeFriendly = (text, { includeClosing = true } = {}) => {
    const intro = pick(intros)
    const closing = includeClosing ? pick(closings) : ''
    return [intro, text, closing].filter(Boolean).join(' ')
  }

  const responseMap = {
    greeting: () => ({
      reply: 'Oi! Eu sou o DinDinMind. Posso analisar saldo, gastos, orçamentos e previsão do mês com base no seu histórico real. Quer começar por resumo, orçamento ou tendência?',
      followUps: ['Como está meu mês?', 'Onde estou gastando mais?', 'Meu orçamento vai estourar?'],
    }),
    help: () => ({
      reply: makeFriendly('Posso te ajudar com saldo, categorias, orçamento, previsão de gastos e economia. Você pode perguntar, por exemplo: “onde estou gastando mais?” ou “vou fechar no vermelho?”.'),
      followUps: ['Resumo do mês', 'Previsão de gastos', 'Categorias críticas'],
    }),
    summary: () => ({
      reply: makeFriendly(`${baseSummary.join(' ')}${trend ? ` A tendência recente está em ${trend} na média diária.` : ''} ${latestTransaction ? `A última movimentação foi ${latestTransaction.description}, no valor de ${formatCurrency(Math.abs(Number(latestTransaction.amount) || 0))}.` : ''}${suggestions[0] ? ` Maior oportunidade agora: ${suggestions[0]}` : ''}`),
      followUps: ['Onde estou gastando mais?', 'Quero ver a previsão', 'Como posso melhorar minhas finanças?'],
    }),
    spending: () => ({
      reply: topCategory
        ? makeFriendly(`A maior pressão do mês está em ${topCategory[0]}, que já soma ${formatCurrency(topCategory[1])}. ${trend ? `Além disso, o ritmo recente de gastos está ${trend}.` : ''}${biggestExpense ? ` Seu maior gasto individual foi "${biggestExpense.description}", de ${formatCurrency(txAmount(biggestExpense))}.` : ''}`)
        : makeFriendly('Ainda não encontrei dados suficientes para identificar um padrão forte de gasto.'),
      followUps: ['Detalhar categoria principal', 'Comparar com orçamento', 'Ver resumo do mês'],
    }),
    improve: () => ({
      reply: suggestions.length
        ? makeFriendly(`Analisei seus números e encontrei ${suggestions.length > 1 ? 'estas oportunidades' : 'esta oportunidade'} de melhoria:\n${suggestions.slice(0, 3).map((text, index) => `${index + 1}. ${text}`).join('\n')}`)
        : makeFriendly(`Pelo que vejo, suas finanças estão equilibradas: saldo de ${formatCurrency(insights.balance || 0)} e poupança de ${(insights.savingsRate || 0).toFixed(1)}%. O próximo nível seria transformar a sobra em meta: defina um valor fixo mensal pra guardar assim que a renda cair, antes de gastar.`),
      followUps: ['Criar um orçamento pra maior categoria', 'Comparar com o mês passado', 'Ver previsão do mês'],
    }),
    compare: () => {
      const { curExpenses, prevExpenses, curByCategory, prevByCategory } = monthComparison
      if (!prevExpenses && !curExpenses) {
        return {
          reply: makeFriendly('Ainda não tenho transações suficientes neste mês e no anterior pra comparar. Conforme você registra, eu monto essa comparação.'),
          followUps: ['Resumo do mês', 'Onde estou gastando mais?', 'Como posso melhorar?'],
        }
      }
      const diff = prevExpenses > 0 ? ((curExpenses - prevExpenses) / prevExpenses) * 100 : 0
      const movers = Object.keys({ ...curByCategory, ...prevByCategory })
        .map((category) => ({ category, delta: (curByCategory[category] || 0) - (prevByCategory[category] || 0) }))
        .filter((item) => Math.abs(item.delta) >= 1)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      const topMover = movers[0]
      return {
        reply: makeFriendly(`Neste mês você gastou ${formatCurrency(curExpenses)} contra ${formatCurrency(prevExpenses)} no mês passado (${diff > 0 ? '+' : ''}${diff.toFixed(0)}%). ${topMover ? `O maior movimento foi em ${topMover.category}: ${topMover.delta > 0 ? 'subiu' : 'caiu'} ${formatCurrency(Math.abs(topMover.delta))}.` : ''} Lembrete: o mês atual ainda está em andamento, então a comparação fecha melhor no fim do mês.`),
        followUps: ['Onde estou gastando mais?', 'Como posso melhorar minhas finanças?', 'Ver previsão do mês'],
      }
    },
    category_detail: () => {
      const total = (insights.categoryExpenses || {})[mentionedCategory] || 0
      const categoryTransactions = transactions.filter((t) => t.type === 'expense' && (t.category || 'outros') === mentionedCategory)
      const share = insights.totalExpenses > 0 ? (total / insights.totalExpenses) * 100 : 0
      const budget = activeBudgets.find((item) => item.category === mentionedCategory)
      return {
        reply: total > 0
          ? makeFriendly(`Em ${mentionedCategory} você gastou ${formatCurrency(total)} neste mês — ${share.toFixed(0)}% de todas as suas despesas${categoryTransactions.length ? `, em ${categoryTransactions.length} lançamento(s), média de ${formatCurrency(total / categoryTransactions.length)} por lançamento` : ''}. ${budget ? `Seu orçamento pra categoria é ${formatCurrency(budget.limit || 0)} e está ${budget.status === 'exceeded' ? 'estourado' : budget.status === 'warning' ? 'em alerta' : 'sob controle'}.` : `Você ainda não tem orçamento pra ${mentionedCategory} — criar um ajuda a segurar essa frente.`}`)
          : makeFriendly(`Não encontrei gastos em ${mentionedCategory} neste mês. Se você costuma gastar aí, pode ser que os lançamentos estejam em outra categoria.`),
        followUps: ['Onde estou gastando mais?', 'Como posso melhorar minhas finanças?', 'Resumo do mês'],
      }
    },
    savings: () => ({
      reply: makeFriendly(`Sua taxa de poupança está em ${(insights.savingsRate || 0).toFixed(1)}%. ${insights.savingsRate >= 20 ? 'Isso é um ótimo sinal.' : 'Vale revisar despesas recorrentes e as categorias mais pesadas para ganhar folga.'}`),
      followUps: ['Como aumentar minha poupança?', 'Ver metas sugeridas', 'Analisar picos de gasto'],
    }),
    budget: () => ({
      reply: overBudget.length
        ? makeFriendly(`Você tem ${overBudget.length} orçamento(s) excedido(s): ${overBudget.map((budget) => budget.category).join(', ')}. ${warningBudgets.length ? `Além disso, ${warningBudgets.length} estão em alerta amarelo.` : ''}`)
        : warningBudgets.length
          ? makeFriendly(`Você tem ${warningBudgets.length} orçamento(s) em alerta. Quer que eu destaque os mais sensíveis primeiro?`)
          : makeFriendly('No momento seus orçamentos estão sob controle. Posso te mostrar onde há mais folga para gastar com segurança.'),
      followUps: ['Quais orçamentos estão críticos?', 'Criar meta de economia', 'Comparar mês atual'],
    }),
    forecast: () => ({
      reply: insights.projectedMonthExpense
        ? makeFriendly(`Pela tendência atual, o mês pode fechar em torno de ${formatCurrency(insights.projectedMonthExpense)}. ${insights.projectedMonthExpense > (insights.totalIncome || 0) ? 'Existe risco de estouro se nada mudar.' : 'Por enquanto, o cenário está controlado.'}`)
        : makeFriendly('Ainda preciso de mais dados para projetar o fechamento do mês com boa confiança.'),
      followUps: ['Como reduzir a projeção?', 'Tendência de gastos', 'Categorias que mais pesam'],
    }),
    seasonality: () => {
      const rankedWeekdays = [...weekdayExpenses].sort((left, right) => right.value - left.value)
      const topDay = rankedWeekdays[0]
      const secondDay = rankedWeekdays[1]

      if (!topDay || topDay.value === 0) {
        return {
          reply: makeFriendly('Ainda não tenho volume suficiente para detectar um padrão semanal claro. Continue registrando despesas e eu comparo os dias para você.'),
          followUps: ['Analisar categoria principal', 'Prever gastos do mês', 'Resumo do mês'],
        }
      }

      const weekAverage = weekdayExpenses.reduce((sum, item) => sum + item.value, 0) / weekdayExpenses.length
      const contrast = secondDay?.value ? ((topDay.value - secondDay.value) / secondDay.value) * 100 : 0
      const highTrafficDays = rankedWeekdays
        .filter((item) => item.value >= weekAverage && item.value > 0)
        .slice(0, 3)
        .map((item) => item.name)

      return {
        reply: makeFriendly(`${topDay.name} é o dia com mais gastos, somando ${formatCurrency(topDay.value)}. ${weekAverage > 0 ? `A média diária da semana está em ${formatCurrency(weekAverage)}.` : ''} ${contrast > 0 ? `Esse dia fica cerca de ${contrast.toFixed(0)}% acima do segundo mais pesado.` : ''}`.trim()),
        followUps: [
          'Comparar com orçamento',
          'Ver tendência de gastos',
          highTrafficDays.length ? `Dias mais pesados: ${highTrafficDays.join(', ')}` : 'Analisar mês atual',
        ],
      }
    },
    categories: () => ({
      reply: topCategory
        ? makeFriendly(`A categoria ${topCategory[0]} lidera seus gastos com ${formatCurrency(topCategory[1])}. Posso comparar isso com o orçamento e sugerir ajustes práticos.`)
        : makeFriendly('Ainda não tenho dados suficientes para destacar categorias com segurança.'),
      followUps: ['Mostrar ranking de categorias', 'Comparar com orçamento', 'Analisar picos'],
    }),
  }

  // Se a mensagem cita uma categoria, a resposta sobre ela é mais útil
  // que a intenção genérica classificada.
  const effectiveIntent = mentionedCategory && !['greeting', 'help'].includes(intent)
    ? 'category_detail'
    : intent

  const selected = responseMap[effectiveIntent] || responseMap.summary
  const result = selected()

  if (confidence < 0.45 && effectiveIntent === intent && intent !== 'greeting' && intent !== 'help') {
    result.reply = `${result.reply} Se isso não foi exatamente o que você queria, me diga com suas palavras e eu ajusto.`
  }

  const contextualSuggestion = recommendations[0]?.title
  if (contextualSuggestion) {
    result.followUps = Array.from(new Set([...(result.followUps || []), contextualSuggestion]))
  }

  return {
    intent: effectiveIntent,
    confidence: effectiveIntent === intent ? confidence : 0.9,
    reply: result.reply,
    followUps: result.followUps || [],
  }
}
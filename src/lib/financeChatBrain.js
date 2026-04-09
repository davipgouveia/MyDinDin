import { formatCurrency } from '../utils/format'

const trainingExamples = {
  summary: [
    'como esta meu mes',
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

export function buildFinanceChatReply({ message, insights = {}, recommendations = [], budgets = [], transactions = [] }) {
  const { intent, confidence } = classifyFinanceIntent(message)
  const topCategory = pickTopCategory(insights.categoryExpenses)
  const weekdayExpenses = getWeekdayExpenses(transactions)
  const activeBudgets = budgets.length ? budgets : []
  const overBudget = activeBudgets.filter((budget) => budget.status === 'exceeded')
  const warningBudgets = activeBudgets.filter((budget) => budget.status === 'warning')
  const latestTransaction = transactions[0]
  const trend = formatTrend(insights.trendChangePercent)

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
      reply: makeFriendly(`${baseSummary.join(' ')}${trend ? ` A tendência recente está em ${trend} na média diária.` : ''} ${latestTransaction ? `A última movimentação foi ${latestTransaction.description}, no valor de ${formatCurrency(Math.abs(Number(latestTransaction.amount) || 0))}.` : ''}`),
      followUps: ['Onde estou gastando mais?', 'Quero ver a previsão', 'Como economizar mais?'],
    }),
    spending: () => ({
      reply: topCategory
        ? makeFriendly(`A maior pressão do mês está em ${topCategory[0]}, que já soma ${formatCurrency(topCategory[1])}. ${trend ? `Além disso, o ritmo recente de gastos está ${trend}.` : ''}`)
        : makeFriendly('Ainda não encontrei dados suficientes para identificar um padrão forte de gasto.'),
      followUps: ['Detalhar categoria principal', 'Comparar com orçamento', 'Ver resumo do mês'],
    }),
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

  const selected = responseMap[intent] || responseMap.summary
  const result = selected()

  if (confidence < 0.45 && intent !== 'greeting' && intent !== 'help') {
    result.reply = `${result.reply} Se isso não foi exatamente o que você queria, me diga com suas palavras e eu ajusto.`
  }

  const contextualSuggestion = recommendations[0]?.title
  if (contextualSuggestion) {
    result.followUps = Array.from(new Set([...(result.followUps || []), contextualSuggestion]))
  }

  return {
    intent,
    confidence,
    reply: result.reply,
    followUps: result.followUps || [],
  }
}
// Lancamento rapido por texto livre + sugestao de categoria.
// Tudo deterministico (sem IA): extrai valor, tipo, data e categoria de
// frases como "50 mercado", "paguei 120 de luz ontem", "recebi 3000 salario".

export const UNCATEGORIZED_LABEL = 'A classificar'

export const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma',
  'para', 'pra', 'com', 'por', 'pelo', 'pela', 'que', 'foi', 'meu', 'minha',
])

const tokenize = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token))

// Mapa de palavras-chave -> nome de categoria (comparado sem acento).
const KEYWORD_CATEGORIES = [
  { category: 'Alimentação', words: ['mercado', 'supermercado', 'feira', 'padaria', 'restaurante', 'lanche', 'lanches', 'pizza', 'pizzaria', 'ifood', 'rappi', 'comida', 'acougue', 'hortifruti', 'sorvete', 'hamburguer', 'sushi', 'churrasco', 'marmita'] },
  { category: 'Transporte', words: ['uber', 'taxi', 'gasolina', 'combustivel', 'etanol', 'diesel', 'estacionamento', 'pedagio', 'onibus', 'metro', 'passagem', '99', 'moto', 'carro', 'oficina', 'pneu'] },
  { category: 'Saúde', words: ['farmacia', 'remedio', 'remedios', 'medico', 'consulta', 'dentista', 'exame', 'exames', 'hospital', 'clinica', 'academia', 'plano de saude', 'terapia', 'psicologo'] },
  { category: 'Educação', words: ['curso', 'cursos', 'livro', 'livros', 'faculdade', 'escola', 'udemy', 'alura', 'aula', 'aulas', 'mensalidade escolar', 'ingles'] },
  { category: 'Lazer', words: ['netflix', 'spotify', 'cinema', 'jogo', 'jogos', 'game', 'games', 'show', 'viagem', 'hotel', 'streaming', 'disney', 'hbo', 'prime video', 'youtube', 'passeio', 'praia', 'bar', 'cerveja'] },
  { category: 'Contas & Serviços', words: ['luz', 'energia', 'agua', 'internet', 'aluguel', 'condominio', 'telefone', 'celular', 'iptu', 'seguro', 'assinatura', 'boleto', 'conta', 'gas', 'vivo', 'claro', 'tim', 'oi', 'enel', 'sabesp'] },
  { category: 'Shopping', words: ['roupa', 'roupas', 'sapato', 'tenis', 'amazon', 'shopee', 'shein', 'loja', 'lojas', 'presente', 'mercado livre', 'magazine', 'casas bahia', 'perfume', 'maquiagem'] },
  { category: 'Salário', words: ['salario', 'pagamento salario', 'holerite', 'ordenado'] },
  { category: 'Freelance', words: ['freela', 'freelance', 'projeto', 'cliente'] },
  { category: 'Vendas', words: ['venda', 'vendas', 'vendi'] },
  { category: 'Investimentos', words: ['dividendo', 'dividendos', 'rendimento', 'juros', 'investimento', 'tesouro', 'cdb'] },
]

const INCOME_HINTS = [
  'recebi', 'recebido', 'recebimento', 'salario', 'entrada', 'receita',
  'reembolso', 'pix recebido', 'venda', 'vendi', 'freela', 'freelance',
  'bonus', 'rendimento', 'dividendo', 'deposito',
]

export function buildLearnedCategoryMap(transactions = []) {
  const counts = new Map()

  transactions.forEach((tx) => {
    if (!tx?.category || tx.category === UNCATEGORIZED_LABEL) return
    tokenize(tx.description).forEach((token) => {
      if (!counts.has(token)) counts.set(token, new Map())
      const perCategory = counts.get(token)
      perCategory.set(tx.category, (perCategory.get(tx.category) || 0) + 1)
    })
  })

  return counts
}

export function suggestCategory(description, { categories = [], learnedMap = null, type = 'expense' } = {}) {
  const available = new Map(categories.map((name) => [normalizeText(name), name]))
  if (available.size === 0) return null

  const text = normalizeText(description)
  const tokens = tokenize(description)

  // 1) Aprendizado com o historico do grupo (vale mais que o chute fixo)
  if (learnedMap) {
    const scores = new Map()
    tokens.forEach((token) => {
      const perCategory = learnedMap.get(token)
      if (!perCategory) return
      perCategory.forEach((count, category) => {
        if (count >= 2 && available.has(normalizeText(category))) {
          scores.set(category, (scores.get(category) || 0) + count)
        }
      })
    })
    const best = [...scores.entries()].sort((a, b) => b[1] - a[1])[0]
    if (best) return best[0]
  }

  // 2) Palavras-chave conhecidas
  for (const entry of KEYWORD_CATEGORIES) {
    const canonical = available.get(normalizeText(entry.category))
    if (!canonical) continue
    const hit = entry.words.some((word) => {
      const normalizedWord = normalizeText(word)
      return normalizedWord.includes(' ')
        ? text.includes(normalizedWord)
        : tokens.includes(normalizedWord)
    })
    if (hit) return canonical
  }

  return null
}

const AMOUNT_PATTERN = /(\d{1,3}(?:\.\d{3})+,\d{1,2}|\d+,\d{1,2}|\d+\.\d{2}|\d+)/g

const parseAmountToken = (token) => {
  if (token.includes(',')) {
    return Number(token.replace(/\./g, '').replace(',', '.'))
  }
  if (/^\d+\.\d{2}$/.test(token)) return Number(token)
  return Number(token)
}

const toISODate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseQuickEntry(rawText, { categories = [], learnedMap = null } = {}) {
  const original = String(rawText || '').trim()
  if (!original) return null

  const matches = [...original.matchAll(AMOUNT_PATTERN)]
  if (matches.length === 0) return null

  // Prefere o primeiro valor com centavos; senao, o primeiro numero.
  const chosen =
    matches.find((match) => /,|\.\d{2}$/.test(match[1])) || matches[0]
  const amount = parseAmountToken(chosen[1])
  if (!Number.isFinite(amount) || amount <= 0) return null

  const text = normalizeText(original)
  let type = 'expense'
  if (original.trimStart().startsWith('+')) type = 'income'
  else if (original.trimStart().startsWith('-')) type = 'expense'
  else if (INCOME_HINTS.some((hint) => text.includes(normalizeText(hint)))) type = 'income'

  // Data: ontem / dia N / dd/mm; padrao = hoje
  const today = new Date()
  let date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dayMonthMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
  const dayOnlyMatch = text.match(/\bdia\s+(\d{1,2})\b/)

  if (text.includes('ontem')) {
    date = new Date(date.getTime() - 24 * 60 * 60 * 1000)
  } else if (dayMonthMatch) {
    const year = dayMonthMatch[3]
      ? Number(dayMonthMatch[3].length === 2 ? `20${dayMonthMatch[3]}` : dayMonthMatch[3])
      : today.getFullYear()
    date = new Date(year, Number(dayMonthMatch[2]) - 1, Number(dayMonthMatch[1]))
  } else if (dayOnlyMatch) {
    const day = Number(dayOnlyMatch[1])
    date = new Date(today.getFullYear(), today.getMonth(), day)
    if (date.getTime() > today.getTime()) {
      date = new Date(today.getFullYear(), today.getMonth() - 1, day)
    }
  }

  // Descricao: o texto sem valor, moeda, marcadores de data e verbos de acao
  let description = original
    .replace(chosen[0], ' ')
    .replace(/r\$/gi, ' ')
    .replace(/\b(ontem|hoje)\b/gi, ' ')
    .replace(/\bdia\s+\d{1,2}\b/gi, ' ')
    .replace(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g, ' ')
    .replace(/^\s*[+-]\s*/, ' ')
    .replace(/^\s*(gastei|paguei|pago|recebi|comprei|entrou)\s+/i, ' ')
    .replace(/^\s*(de|da|do|das|dos|no|na|em)\s+/i, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const category = suggestCategory(description || original, { categories, learnedMap, type })

  if (!description) description = category || 'Lançamento rápido'
  description = description.charAt(0).toUpperCase() + description.slice(1)

  return {
    amount,
    type,
    description,
    category,
    dateISO: toISODate(date),
  }
}

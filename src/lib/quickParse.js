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
// `types` restringe a regra a entradas ou saídas: sem isso, uma despesa
// com "pagamento" caía em Salário e um rendimento caía em despesa. As
// palavras cobrem também o vocabulário dos extratos bancários (tarifas,
// códigos abreviados e redes conhecidas), que é de onde vem a maioria
// dos lançamentos "A classificar".
const KEYWORD_CATEGORIES = [
  { category: 'Alimentação', types: ['expense'], words: ['mercado', 'supermercado', 'mercadinho', 'feira', 'padaria', 'restaurante', 'lanche', 'lanches', 'pizza', 'pizzaria', 'ifood', 'rappi', 'ubereats', 'aiqfome', 'delivery', 'comida', 'acougue', 'hortifruti', 'sorvete', 'hamburguer', 'sushi', 'churrasco', 'marmita', 'carrefour', 'atacadao', 'assai', 'sonda', 'hirota', 'mambo', 'quitanda', 'acai', 'pastel', 'cafeteria', 'starbucks', 'churrascaria'] },
  { category: 'Transporte', types: ['expense'], words: ['uber', 'taxi', 'gasolina', 'combustivel', 'etanol', 'diesel', 'estacionamento', 'pedagio', 'onibus', 'metro', 'passagem', '99', '99app', 'moto', 'carro', 'oficina', 'pneu', 'posto', 'ipiranga', 'shell', 'raizen', 'cabify', 'indrive', 'veloe', 'conectcar', 'sem parar', 'latam', 'azul linhas', 'rodoviaria'] },
  { category: 'Saúde', types: ['expense'], words: ['farmacia', 'drogaria', 'drogasil', 'raia', 'pacheco', 'ultrafarma', 'panvel', 'pague menos', 'remedio', 'remedios', 'medico', 'consulta', 'dentista', 'odonto', 'exame', 'exames', 'hospital', 'clinica', 'laboratorio', 'vacina', 'academia', 'smartfit', 'selfit', 'bluefit', 'plano de saude', 'terapia', 'psicologo', 'otica', 'oculos', 'veterinario'] },
  { category: 'Educação', types: ['expense'], words: ['curso', 'cursos', 'livro', 'livros', 'faculdade', 'escola', 'udemy', 'alura', 'coursera', 'rocketseat', 'aula', 'aulas', 'mensalidade escolar', 'mensalidade', 'papelaria', 'ingles', 'kindle'] },
  { category: 'Lazer', types: ['expense'], words: ['netflix', 'spotify', 'deezer', 'globoplay', 'paramount', 'crunchyroll', 'cinema', 'jogo', 'jogos', 'game', 'games', 'steam', 'playstation', 'xbox', 'nintendo', 'show', 'viagem', 'hotel', 'airbnb', 'booking', 'decolar', 'streaming', 'disney', 'hbo', 'prime video', 'youtube', 'ingresso', 'ingressos', 'sympla', 'eventim', 'teatro', 'passeio', 'praia', 'bar', 'cerveja', 'boliche'] },
  { category: 'Contas & Serviços', types: ['expense'], words: ['luz', 'energia', 'agua', 'internet', 'aluguel', 'condominio', 'telefone', 'celular', 'iptu', 'seguro', 'assinatura', 'boleto', 'conta', 'gas', 'vivo', 'claro', 'tim', 'oi', 'enel', 'sabesp', 'tarifa', 'tar', 'iof', 'anuidade', 'pacote de servicos', 'manutencao de conta', 'cobranca', 'ted', 'doc', 'fatura', 'parcela', 'financiamento', 'emprestimo', 'consorcio', 'cartao', 'saque', 'darf', 'imposto', 'taxa', 'multa', 'correios', 'cartorio', 'previdencia', 'juros', 'encargos'] },
  { category: 'Shopping', types: ['expense'], words: ['roupa', 'roupas', 'sapato', 'tenis', 'amazon', 'shopee', 'shein', 'loja', 'lojas', 'presente', 'mercado livre', 'mercadolivre', 'magazine', 'magalu', 'casas bahia', 'renner', 'riachuelo', 'zara', 'decathlon', 'leroy', 'kalunga', 'samsung', 'xiaomi', 'nike', 'adidas', 'centauro', 'netshoes', 'perfume', 'maquiagem'] },
  { category: 'Salário', types: ['income'], words: ['salario', 'pagamento salario', 'holerite', 'ordenado', 'folha de pagamento', 'adiantamento salarial'] },
  { category: 'Freelance', types: ['income'], words: ['freela', 'freelance', 'projeto'] },
  { category: 'Vendas', types: ['income'], words: ['venda', 'vendas', 'vendi'] },
  { category: 'Investimentos', types: ['income'], words: ['dividendo', 'dividendos', 'rendimento', 'rend', 'aplic', 'resgate', 'proventos', 'juros', 'investimento', 'tesouro', 'cdb', 'jcp'] },
  { category: 'Outros', types: ['income'], words: ['cashback', 'estorno', 'reembolso', 'devolucao'] },
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

  // 2) Palavras-chave conhecidas (respeitando o tipo do lançamento).
  // Duas passagens: primeiro as FRASES ("mercado livre" é Shopping e
  // vence o "mercado" solto da Alimentação), depois as palavras soltas.
  // Além do token exato, aceita o token que COMEÇA com a palavra-chave
  // (plurais e grafias grudadas do extrato: "drogarias", "tarifas",
  // "mercados") quando a palavra tem 5+ letras.
  const entries = KEYWORD_CATEGORIES.filter(
    (entry) => !entry.types || entry.types.includes(type),
  )

  for (const entry of entries) {
    const canonical = available.get(normalizeText(entry.category))
    if (!canonical) continue
    const hit = entry.words.some((word) => {
      const normalizedWord = normalizeText(word)
      return normalizedWord.includes(' ') && text.includes(normalizedWord)
    })
    if (hit) return canonical
  }

  for (const entry of entries) {
    const canonical = available.get(normalizeText(entry.category))
    if (!canonical) continue
    const hit = entry.words.some((word) => {
      const normalizedWord = normalizeText(word)
      if (normalizedWord.includes(' ')) return false
      return tokens.some((token) => (
        token === normalizedWord
        || (normalizedWord.length >= 5 && token.startsWith(normalizedWord))
      ))
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

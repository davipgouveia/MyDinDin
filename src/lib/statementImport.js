// Importacao de extrato (conta) e fatura (cartao): CSV e OFX.
// Retorna lancamentos normalizados { dateISO, description, amount, type }
// onde amount e sempre positivo e type indica entrada/saida.

import { normalizeText } from './quickParse'

export const dedupeKey = (dateISO, amount, description) =>
  `${dateISO}|${Number(amount).toFixed(2)}|${normalizeText(description).replace(/\s+/g, ' ')}`

// Assinatura de padrão de uma descrição de extrato: o "nome do lugar" sem
// as datas e números que o banco gruda no texto. É o que permite aprender
// "RSCSS DROGARIA SAO1908" e "RSCSS DROGARIA SAO0210" como o MESMO
// padrão, ou "PIX TRANSF LARYSSA19/08" e "PIX TRANSF LARYSSA21/08".
export function descriptionSignature(description) {
  const tokens = normalizeText(description || '')
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, ' ')
    .replace(/\b\d{3,}\b/g, ' ')
    .split(' ')
    .map((token) => token.replace(/\d+$/g, ''))
    .filter((token) => token.length >= 2)

  return tokens.slice(0, 3).join(' ')
}

export function parseBRNumber(raw) {
  if (typeof raw === 'number') return raw
  let text = String(raw ?? '').trim()
  if (!text) return NaN

  let negative = false
  if (/^\(.*\)$/.test(text)) {
    negative = true
    text = text.slice(1, -1)
  }
  if (text.startsWith('-')) negative = true
  if (text.startsWith('+')) text = text.slice(1)

  text = text.replace(/r\$/gi, '').replace(/[^0-9.,]/g, '').trim()
  if (!text) return NaN

  let value
  if (text.includes(',')) {
    value = Number(text.replace(/\./g, '').replace(',', '.'))
  } else if (/^\d+\.\d{2}$/.test(text) || /^\d+\.\d{3}$/.test(text)) {
    value = Number(text)
  } else {
    value = Number(text.replace(/\./g, ''))
  }

  if (!Number.isFinite(value)) return NaN
  return negative ? -value : value
}

export function parseStatementDate(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return null

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`

  match = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3]
    const month = match[2].padStart(2, '0')
    const day = match[1].padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // OFX: YYYYMMDD ou YYYYMMDDHHMMSS
  match = text.match(/^(\d{4})(\d{2})(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`

  return null
}

// --- OFX ---

const ofxTagValue = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}>([^<\r\n]+)`, 'i'))
  return match ? match[1].trim() : ''
}

function parseOfx(text) {
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/STMTTRN>|<\/BANKTRANLIST>|<\/CCSTMTTRNRS>|$)/gi) || []

  const rows = []
  blocks.forEach((block) => {
    const dateISO = parseStatementDate(ofxTagValue(block, 'DTPOSTED'))
    const amount = parseBRNumber(ofxTagValue(block, 'TRNAMT'))
    const description = ofxTagValue(block, 'MEMO') || ofxTagValue(block, 'NAME') || 'Lancamento importado'

    if (!dateISO || !Number.isFinite(amount) || amount === 0) return

    const trnType = ofxTagValue(block, 'TRNTYPE').toUpperCase()
    const type = trnType === 'CREDIT' || amount > 0 ? 'income' : 'expense'

    rows.push({ dateISO, description, amount: Math.abs(amount), type })
  })

  return rows
}

// --- CSV ---

function splitCsv(text, delimiter) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      field = ''
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)
      row = []
    } else {
      field += char
    }
  }

  row.push(field)
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row)

  return rows
}

const headerIncludes = (headers, candidates) =>
  headers.findIndex((header) => candidates.some((candidate) => header.includes(candidate)))

function parseCsv(text, fileName = '') {
  const clean = text.replace(/^﻿/, '')
  const firstLine = clean.split(/\r?\n/)[0] || ''
  const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ','

  const table = splitCsv(clean, delimiter)
  if (table.length === 0) return []

  const headers = table[0].map((header) => normalizeText(header))
  const dateIdx = headerIncludes(headers, ['data', 'date', 'dia'])
  const descIdx = headerIncludes(headers, ['descri', 'histor', 'memo', 'title', 'titulo', 'estabelecimento', 'lancamento', 'detalhe', 'nome'])
  const amountIdx = headerIncludes(headers, ['valor', 'amount', 'quantia', 'total'])
  const creditIdx = headerIncludes(headers, ['credit', 'entrada', 'receita'])
  const debitIdx = headerIncludes(headers, ['debit', 'saida', 'despesa'])

  const hasHeader = dateIdx !== -1 && (descIdx !== -1 || amountIdx !== -1 || creditIdx !== -1 || debitIdx !== -1)

  // Fatura de cartao (ex.: Nubank: date,title,amount) usa a convencao
  // OPOSTA do extrato: valor positivo = compra (despesa) e negativo =
  // pagamento/estorno (receita). Extrato: negativo = saida.
  const isCardStatement =
    headers.some((header) => header === 'title')
    || /fatura|nubank|invoice|cartao|card/.test(normalizeText(fileName))

  const rows = []
  const pushRow = (dateISO, description, signedAmount) => {
    if (!dateISO || !Number.isFinite(signedAmount) || signedAmount === 0) return
    const type = isCardStatement
      ? signedAmount > 0 ? 'expense' : 'income'
      : signedAmount > 0 ? 'income' : 'expense'
    rows.push({
      dateISO,
      description: String(description || '').trim() || 'Lancamento importado',
      amount: Math.abs(signedAmount),
      type,
    })
  }

  if (hasHeader) {
    for (let i = 1; i < table.length; i += 1) {
      const cells = table[i]
      const dateISO = parseStatementDate(cells[dateIdx])

      if (creditIdx !== -1 || debitIdx !== -1) {
        const credit = creditIdx !== -1 ? parseBRNumber(cells[creditIdx]) : NaN
        const debit = debitIdx !== -1 ? parseBRNumber(cells[debitIdx]) : NaN
        if (Number.isFinite(credit) && credit !== 0) pushRow(dateISO, cells[descIdx], Math.abs(credit))
        else if (Number.isFinite(debit) && debit !== 0) pushRow(dateISO, cells[descIdx], -Math.abs(debit))
        continue
      }

      pushRow(dateISO, cells[descIdx], parseBRNumber(cells[amountIdx]))
    }
    return rows
  }

  // Sem cabecalho reconhecivel: infere pelas primeiras linhas com cara de dados
  for (let i = 0; i < table.length; i += 1) {
    const cells = table[i]
    let dateISO = null
    let dateCol = -1

    cells.forEach((cell, idx) => {
      if (dateISO) return
      const parsed = parseStatementDate(cell)
      if (parsed) {
        dateISO = parsed
        dateCol = idx
      }
    })
    if (!dateISO) continue

    let amount = NaN
    let amountCol = -1
    for (let idx = cells.length - 1; idx >= 0; idx -= 1) {
      if (idx === dateCol) continue
      const parsed = parseBRNumber(cells[idx])
      if (Number.isFinite(parsed) && parsed !== 0) {
        amount = parsed
        amountCol = idx
        break
      }
    }
    if (!Number.isFinite(amount)) continue

    const description = cells
      .filter((_, idx) => idx !== dateCol && idx !== amountCol)
      .sort((a, b) => String(b).length - String(a).length)[0]

    pushRow(dateISO, description, amount)
  }

  return rows
}

// --- PDF (texto extraído pelo pdf.js; entra linha a linha) ---

const PT_MONTHS = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
}

// Linhas de resumo/cabeçalho que têm data e valor mas NÃO são lançamentos.
const PDF_SKIP_SNIPPETS = [
  'saldo anterior', 'saldo final', 'saldo do dia', 'saldo atual', 'saldo em',
  'total da fatura', 'total geral', 'subtotal', 'pagamento minimo',
  'limite de credito', 'limite total', 'limite disponivel', 'credito rotativo',
  'melhor data', 'data historico', 'demonstrativo', 'central de atendimento',
  'juros rotativo', 'encargos financeiros', 'total a pagar',
]

// (A classificação entrada/saída no extrato segue o SINAL do valor e os
// sufixos D/C — ver parsePdf. Sem dica de descrição: no extrato do Itaú,
// valor positivo sem sinal é crédito, e dicas por palavra quebravam
// casos reais como "REND PAGO APLIC AUT MAIS".)

// Um valor monetário brasileiro: 1.234,56 / 45,90 / -150,00 / (200,00),
// com R$ opcional e sufixo D (débito) ou C (crédito) usado por alguns bancos.
const MONEY_TOKEN_RE = /\(?-?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}\)?\s?[DC]?\b|\(?-?\s*(?:R\$\s*)?\d+,\d{2}\)?\s?[DC]?\b/g

function parsePdf(text, fileName = '') {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
  if (lines.length === 0) return []

  const headText = normalizeText(lines.slice(0, 40).join(' '))
  const isCardStatement = headText.includes('fatura') || /fatura|nubank|invoice|cartao|card/.test(normalizeText(fileName))

  // Data de referência do documento (ex.: vencimento da fatura) pra
  // inferir o ano das linhas que só trazem dia/mês.
  let ref = null
  for (const line of lines.slice(0, 40)) {
    const match = line.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](20\d{2})/)
    if (match) {
      ref = { month: Number(match[2]), year: Number(match[3]) }
      break
    }
  }
  const inferYear = (month) => {
    if (ref) return month <= ref.month ? ref.year : ref.year - 1
    const now = new Date()
    return month > now.getMonth() + 1 ? now.getFullYear() - 1 : now.getFullYear()
  }

  const findDate = (line) => {
    let match = line.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
    if (match) {
      const iso = parseStatementDate(match[0])
      return iso ? { iso, end: match.index + match[0].length } : null
    }
    match = line.match(/\b(\d{1,2})[/\-.](\d{1,2})\b/)
    if (match) {
      const month = match[2].padStart(2, '0')
      const day = match[1].padStart(2, '0')
      return { iso: `${inferYear(Number(match[2]))}-${month}-${day}`, end: match.index + match[0].length }
    }
    match = line.match(/\b(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/i)
    if (match) {
      const month = PT_MONTHS[match[2].toLowerCase()]
      const day = match[1].padStart(2, '0')
      return { iso: `${inferYear(Number(month))}-${month}-${day}`, end: match.index + match[0].length }
    }
    return null
  }

  const rows = []
  for (const line of lines) {
    const normalizedLine = normalizeText(line)
    if (PDF_SKIP_SNIPPETS.some((snippet) => normalizedLine.includes(snippet))) continue

    const date = findDate(line)
    if (!date) continue

    const tokens = [...line.matchAll(MONEY_TOKEN_RE)]
      .map((match) => ({ raw: match[0], index: match.index }))
      .filter((token) => token.index >= date.end - 1)
    if (tokens.length === 0) continue

    // O valor do lançamento é o primeiro depois da data; quando a linha
    // também traz o saldo corrida, ele vem depois e é ignorado.
    const token = tokens[0]
    const suffix = /([DC])\s*$/.test(token.raw.trim()) ? token.raw.trim().slice(-1) : null
    const value = parseBRNumber(token.raw.replace(/\s?[DC]\s*$/, ''))
    if (!Number.isFinite(value) || value === 0) continue

    // Convenção dos extratos (Itaú, Nubank conta etc.): o sinal manda —
    // negativo (ou sufixo D) = saída; positivo (ou sufixo C) = entrada.
    // Na fatura é o contrário: positivo = compra (saída) e o pagamento
    // vem negativo (entrada).
    let type
    if (suffix === 'D') type = 'expense'
    else if (suffix === 'C') type = 'income'
    else if (value < 0) type = isCardStatement ? 'income' : 'expense'
    else type = isCardStatement ? 'expense' : 'income'

    const description = line
      .slice(0, token.index)
      .replace(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/, ' ')
      .replace(/\b(\d{1,2})[/\-.](\d{1,2})\b/, ' ')
      .replace(/\b(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/i, ' ')
      .concat(' ', line.slice(token.index + token.raw.length).replace(MONEY_TOKEN_RE, ' '))
      .replace(/r\$/gi, ' ')
      .replace(/^[-\s•|·]+|[-\s•|·]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (description.length < 2) continue

    rows.push({ dateISO: date.iso, description, amount: Math.abs(value), type })
  }

  return rows
}

export function parseStatementText(text, fileName = '') {
  const content = String(text || '')
  if (!content.trim()) return { rows: [], format: null }

  if (/\.pdf$/i.test(fileName)) {
    return {
      rows: parsePdf(content, fileName).sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
      format: 'PDF',
    }
  }

  const isOfx = /<OFX/i.test(content) || /<STMTTRN>/i.test(content) || /\.ofx$/i.test(fileName)
  const rows = isOfx ? parseOfx(content) : parseCsv(content, fileName)

  return {
    rows: rows.sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    format: isOfx ? 'OFX' : 'CSV',
  }
}

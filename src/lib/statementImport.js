// Importacao de extrato (conta) e fatura (cartao): CSV e OFX.
// Retorna lancamentos normalizados { dateISO, description, amount, type }
// onde amount e sempre positivo e type indica entrada/saida.

import { normalizeText } from './quickParse'

export const dedupeKey = (dateISO, amount, description) =>
  `${dateISO}|${Number(amount).toFixed(2)}|${normalizeText(description).replace(/\s+/g, ' ')}`

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

export function parseStatementText(text, fileName = '') {
  const content = String(text || '')
  if (!content.trim()) return { rows: [], format: null }

  const isOfx = /<OFX/i.test(content) || /<STMTTRN>/i.test(content) || /\.ofx$/i.test(fileName)
  const rows = isOfx ? parseOfx(content) : parseCsv(content, fileName)

  return {
    rows: rows.sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    format: isOfx ? 'OFX' : 'CSV',
  }
}

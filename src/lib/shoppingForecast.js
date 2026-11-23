// Previsao de termino de produtos de consumo (modulo Compras).
// Mesma logica do app de referencia, por ordem de prioridade:
//   1. Manual: duration_days_override (dias que 1 unidade dura).
//   2. Marcacoes de "acabou": cada intervalo compra -> acabou vira uma
//      amostra (quantidade comprada / dias).
//   3. Intervalo entre compras: assume que se recompra quando acaba.
// Requer ao menos 2 compras do produto, ou 1 compra + 1 "acabou"
// (a taxa manual dispensa historico, mas precisa de 1 compra pra
// saber o estoque atual). Produtos duraveis ficam fora da previsao.

export const FORECAST_WARN_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

function toDateOnly(value) {
  if (!value) return null
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS)
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

function isoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Calcula a previsao de um produto.
 * @param {object} product - { consumable, duration_days_override }
 * @param {Array} purchases - compras do produto: [{ date, quantity }] (qualquer ordem)
 * @param {Array} finishedDates - datas (AAAA-MM-DD) das marcacoes de "acabou"
 * @param {Date} [today]
 * @returns {{ status: 'ok'|'acabando'|'acabou'|'sem_dados', rate_per_day: number|null,
 *             days_per_unit: number|null, estimated_remaining: number|null,
 *             days_left: number|null, run_out_date: string|null, source: string|null }}
 */
export function computeForecast(product, purchases, finishedDates, today = new Date()) {
  const empty = {
    status: 'sem_dados',
    rate_per_day: null,
    days_per_unit: null,
    estimated_remaining: null,
    days_left: null,
    run_out_date: null,
    source: null,
  }

  if (!product || product.consumable === false) return empty

  const buys = (purchases || [])
    .map((p) => ({ date: toDateOnly(p.date), quantity: Number(p.quantity) || 0 }))
    .filter((p) => p.date && p.quantity > 0)
    .sort((a, b) => a.date - b.date)

  if (buys.length === 0) return empty

  const finished = (finishedDates || [])
    .map((d) => toDateOnly(d))
    .filter(Boolean)
    .sort((a, b) => a - b)

  const todayD = toDateOnly(isoDate(today)) || new Date(today)

  // ---- Taxa de consumo (unidades/dia) ----
  let rate = null
  let source = null

  const override = Number(product.duration_days_override)
  if (override > 0) {
    rate = 1 / override
    source = 'manual'
  }

  if (!rate && finished.length > 0) {
    // Amostras compra -> acabou.
    const samples = []
    let prevFinished = null
    for (const f of finished) {
      const windowBuys = buys.filter(
        (b) => (!prevFinished || b.date > prevFinished) && b.date <= f,
      )
      if (windowBuys.length > 0) {
        const qty = windowBuys.reduce((sum, b) => sum + b.quantity, 0)
        const days = diffDays(windowBuys[0].date, f)
        if (days > 0 && qty > 0) samples.push(qty / days)
      }
      prevFinished = f
    }
    if (samples.length > 0) {
      rate = samples.reduce((a, b) => a + b, 0) / samples.length
      source = 'acabou'
    }
  }

  if (!rate && buys.length >= 2) {
    // Intervalos entre compras: a quantidade da compra anterior dura
    // ate a compra seguinte.
    const samples = []
    for (let i = 0; i < buys.length - 1; i += 1) {
      const days = diffDays(buys[i].date, buys[i + 1].date)
      if (days > 0) samples.push(buys[i].quantity / days)
    }
    if (samples.length > 0) {
      rate = samples.reduce((a, b) => a + b, 0) / samples.length
      source = 'intervalo'
    }
  }

  if (!rate || rate <= 0) return empty

  // ---- Janela de estoque atual ----
  const lastFinished = finished.length > 0 ? finished[finished.length - 1] : null
  const lastBuy = buys[buys.length - 1]

  // "Acabou" e a marcacao mais recente depois da ultima compra.
  if (lastFinished && lastFinished >= lastBuy.date) {
    return {
      status: 'acabou',
      rate_per_day: rate,
      days_per_unit: 1 / rate,
      estimated_remaining: 0,
      days_left: 0,
      run_out_date: isoDate(lastFinished),
      source,
    }
  }

  const windowBuys = lastFinished ? buys.filter((b) => b.date > lastFinished) : buys
  if (windowBuys.length === 0) return empty

  const stockBought = windowBuys.reduce((sum, b) => sum + b.quantity, 0)
  const consumedDays = Math.max(0, diffDays(windowBuys[0].date, todayD))
  const consumed = rate * consumedDays
  const remaining = Math.max(0, stockBought - consumed)
  const daysLeft = remaining / rate
  const runOut = addDays(todayD, Math.round(daysLeft))

  return {
    status: remaining <= 0 ? 'acabou' : daysLeft <= FORECAST_WARN_DAYS ? 'acabando' : 'ok',
    rate_per_day: rate,
    days_per_unit: 1 / rate,
    estimated_remaining: Math.round(remaining * 100) / 100,
    days_left: Math.round(daysLeft * 10) / 10,
    run_out_date: isoDate(runOut),
    source,
  }
}

/**
 * Previsao de todos os produtos consumiveis.
 * @param {Array} products
 * @param {Map|object} purchasesByProduct - product_id -> [{date, quantity}]
 * @param {Map|object} finishedByProduct - product_id -> [date]
 * Retorna [{ product, forecast }] ordenado do mais urgente ao menos.
 */
export function computeAllForecasts(products, purchasesByProduct, finishedByProduct, today = new Date()) {
  const get = (map, key) => (map instanceof Map ? map.get(key) : map?.[key]) || []
  const rows = []
  for (const product of products || []) {
    if (product.consumable === false) continue
    const forecast = computeForecast(
      product,
      get(purchasesByProduct, product.id),
      get(finishedByProduct, product.id),
      today,
    )
    rows.push({ product, forecast })
  }
  const rank = { acabou: 0, acabando: 1, ok: 2, sem_dados: 3 }
  rows.sort((a, b) => {
    const r = rank[a.forecast.status] - rank[b.forecast.status]
    if (r !== 0) return r
    const da = a.forecast.days_left ?? Number.POSITIVE_INFINITY
    const db = b.forecast.days_left ?? Number.POSITIVE_INFINITY
    return da - db
  })
  return rows
}

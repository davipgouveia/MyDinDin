// Servidor da API do modulo Compras (app/api/compras).
// Autenticacao dupla:
//   1. Sessao do app: Authorization: Bearer <access_token do Supabase>.
//   2. Token pessoal de API: Authorization: Bearer mdd_... (ou X-API-Key).
//      Cada membro do grupo gera o proprio token no app (aba "API e
//      Muse") e conecta o Muse dele. No banco fica so o hash SHA-256;
//      o token age como a pessoa dona dele, dentro do grupo dela.
// As operacoes rodam com a service role e escopo explicito por group_id
// resolvido da autenticacao — nunca de parametros da requisicao.
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import { getUserFromRequest } from './serverAuth'
import { normalizeText } from './quickParse'
import { roundMoney } from '../utils/format'
import { computeAllForecasts, computeForecast } from './shoppingForecast'

export const nameNorm = (name) => normalizeText(String(name || '').trim().replace(/\s+/g, ' '))

export function itemTotal(item) {
  if (item.total_price != null) return roundMoney(Number(item.total_price) || 0)
  if (item.unit_price != null) return roundMoney((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))
  return 0
}

export function purchaseTotal(purchase) {
  return roundMoney((purchase?.items || []).reduce((sum, item) => sum + itemTotal(item), 0))
}

export function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

export async function resolveApiAuth(request) {
  const admin = getAdminClient()
  if (!admin) return null

  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  const apiKey = (request.headers.get('x-api-key') || '').trim()
  const tokenCandidate = apiKey || (bearer.startsWith('mdd_') ? bearer : '')

  if (tokenCandidate.startsWith('mdd_')) {
    const { data: tokenRow } = await admin
      .from('api_tokens')
      .select('id, user_id, group_id, revoked_at')
      .eq('token_hash', sha256(tokenCandidate))
      .maybeSingle()
    if (!tokenRow || tokenRow.revoked_at) return null
    await admin.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tokenRow.id)
    return { userId: tokenRow.user_id, groupId: tokenRow.group_id, via: 'token', tokenId: tokenRow.id, admin }
  }

  const user = await getUserFromRequest(request)
  if (!user) return null
  const { data: profile } = await admin
    .from('profiles')
    .select('id, group_id')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) return null
  return { userId: user.id, groupId: profile.group_id, via: 'session', admin }
}

// ---------------- Tokens pessoais ----------------

export function generateApiToken() {
  return `mdd_${randomBytes(24).toString('base64url')}`
}

export async function createApiToken(admin, { userId, groupId, name }) {
  const token = generateApiToken()
  const { data, error } = await admin
    .from('api_tokens')
    .insert({ user_id: userId, group_id: groupId, name: name || 'Meu Muse', token_hash: sha256(token) })
    .select('id, name, created_at')
    .single()
  if (error) throw error
  // O token cru e devolvido UMA unica vez (na criacao).
  return { ...data, token }
}

export async function listApiTokens(admin, userId) {
  const { data, error } = await admin
    .from('api_tokens')
    .select('id, name, created_at, last_used_at, revoked_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function revokeApiToken(admin, userId, tokenId) {
  const { error } = await admin
    .from('api_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenId)
    .eq('user_id', userId)
  if (error) throw error
}

// ---------------- Resolucao por nome ou id ----------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function resolveStore(admin, groupId, ref) {
  if (!ref) return null
  const value = decodeURIComponent(String(ref))
  if (UUID_RE.test(value)) {
    const { data } = await admin.from('stores').select('*').eq('group_id', groupId).eq('id', value).maybeSingle()
    if (data) return data
  }
  const { data } = await admin
    .from('stores')
    .select('*')
    .eq('group_id', groupId)
    .eq('name_norm', nameNorm(value))
    .maybeSingle()
  return data || null
}

export async function resolveProduct(admin, groupId, ref) {
  if (!ref) return null
  const value = decodeURIComponent(String(ref))
  if (UUID_RE.test(value)) {
    const { data } = await admin.from('products').select('*').eq('group_id', groupId).eq('id', value).maybeSingle()
    if (data) return data
  }
  const { data } = await admin
    .from('products')
    .select('*')
    .eq('group_id', groupId)
    .eq('name_norm', nameNorm(value))
    .maybeSingle()
  return data || null
}

export async function findOrCreateStore(admin, groupId, userId, name, kind) {
  const existing = await resolveStore(admin, groupId, name)
  if (existing) return existing
  const { data, error } = await admin
    .from('stores')
    .insert({ group_id: groupId, name: String(name).trim(), name_norm: nameNorm(name), kind: kind || 'mercado', created_by: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function findOrCreateProduct(admin, groupId, userId, name, extra = {}) {
  const existing = await resolveProduct(admin, groupId, name)
  if (existing) return existing
  const { data, error } = await admin
    .from('products')
    .insert({
      group_id: groupId,
      name: String(name).trim(),
      name_norm: nameNorm(name),
      category: extra.category || null,
      unit: extra.unit || 'un',
      brand: extra.brand || null,
      consumable: extra.consumable !== false,
      created_by: userId,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// ---------------- Consultas base ----------------

export async function listPurchases(admin, groupId, { limit = 100, since, until, productId, storeId } = {}) {
  let query = admin
    .from('purchases')
    .select('*, store:stores(id, name, kind), items:purchase_items(*, product:products(id, name, unit))')
    .eq('group_id', groupId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (since) query = query.gte('date', since)
  if (until) query = query.lte('date', until)
  if (storeId) query = query.eq('store_id', storeId)
  const { data, error } = await query
  if (error) throw error
  let rows = data || []
  if (productId) rows = rows.filter((p) => (p.items || []).some((i) => i.product_id === productId))
  return rows
}

export async function getPurchase(admin, groupId, id) {
  const { data, error } = await admin
    .from('purchases')
    .select('*, store:stores(id, name, kind), items:purchase_items(*, product:products(id, name, unit))')
    .eq('group_id', groupId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function loadForecast(admin, groupId) {
  const [{ data: products }, purchases, { data: finished }] = await Promise.all([
    admin.from('products').select('*').eq('group_id', groupId).order('name'),
    listPurchases(admin, groupId, { limit: 1000 }),
    admin.from('finished_events').select('*').eq('group_id', groupId).order('date', { ascending: false }),
  ])
  const purchasesByProduct = new Map()
  for (const purchase of purchases) {
    for (const item of purchase.items || []) {
      if (!purchasesByProduct.has(item.product_id)) purchasesByProduct.set(item.product_id, [])
      purchasesByProduct.get(item.product_id).push({ date: purchase.date, quantity: Number(item.quantity) || 0 })
    }
  }
  const finishedByProduct = new Map()
  for (const event of finished || []) {
    if (!finishedByProduct.has(event.product_id)) finishedByProduct.set(event.product_id, [])
    finishedByProduct.get(event.product_id).push(event.date)
  }
  return { products: products || [], purchasesByProduct, finishedByProduct }
}

export async function getForecast(admin, groupId) {
  const { products, purchasesByProduct, finishedByProduct } = await loadForecast(admin, groupId)
  return computeAllForecasts(products, purchasesByProduct, finishedByProduct)
}

export async function productPrices(admin, groupId, productId) {
  const { data, error } = await admin
    .from('purchase_items')
    .select('id, quantity, unit_price, total_price, purchase:purchases!inner(id, date, store_id, store:stores(id, name))')
    .eq('group_id', groupId)
    .eq('product_id', productId)
    .limit(500)
  if (error) throw error
  const rows = (data || []).filter((r) => r.unit_price != null)
    .sort((a, b) => String(b.purchase?.date).localeCompare(String(a.purchase?.date)))
  const byStore = new Map()
  for (const row of rows) {
    const store = row.purchase?.store
    if (!store) continue
    if (!byStore.has(store.id)) byStore.set(store.id, { store, prices: [] })
    byStore.get(store.id).prices.push(row)
  }
  const by_store = [...byStore.values()].map(({ store, prices }) => ({
    store,
    last_price: Number(prices[0].unit_price),
    last_date: prices[0].purchase?.date,
    avg_price: roundMoney(prices.reduce((s, p) => s + Number(p.unit_price), 0) / prices.length),
    purchases: prices.length,
  })).sort((a, b) => a.last_price - b.last_price)
  return {
    history: rows.map((r) => ({
      date: r.purchase?.date,
      store: r.purchase?.store || null,
      quantity: Number(r.quantity),
      unit_price: Number(r.unit_price),
      total_price: r.total_price != null ? Number(r.total_price) : null,
    })),
    by_store,
    cheapest: by_store[0] || null,
  }
}

export async function comparePrices(admin, groupId) {
  const purchases = await listPurchases(admin, groupId, { limit: 500 })
  const latest = new Map()
  const productsById = new Map()
  for (const purchase of purchases) {
    for (const item of purchase.items || []) {
      if (item.unit_price == null || !purchase.store) continue
      if (!latest.has(item.product_id)) latest.set(item.product_id, new Map())
      const perStore = latest.get(item.product_id)
      const current = perStore.get(purchase.store.id)
      if (!current || purchase.date > current.date) {
        perStore.set(purchase.store.id, { price: Number(item.unit_price), date: purchase.date })
      }
      if (item.product) productsById.set(item.product_id, item.product)
    }
  }
  return [...latest.entries()].map(([productId, perStore]) => {
    const stores = [...perStore.entries()].map(([store_id, v]) => ({ store_id, ...v })).sort((a, b) => a.price - b.price)
    return { product: productsById.get(productId) || { id: productId }, stores, cheapest_store_id: stores[0]?.store_id }
  })
}

// ---------------- Escrita ----------------

export async function createFinanceExpense(admin, groupId, userId, { amount, date, categoryName, note }) {
  const { data: categories } = await admin.from('categories').select('id, name').eq('group_id', groupId)
  const target = nameNorm(categoryName || 'Mercado')
  let category = (categories || []).find((c) => nameNorm(c.name) === target)
  if (!category) {
    const { data, error } = await admin
      .from('categories')
      .insert({ group_id: groupId, name: categoryName || 'Mercado', created_by: userId })
      .select('id, name')
      .single()
    if (error) throw error
    category = data
  }
  const { data: tx, error } = await admin
    .from('transactions')
    .insert({
      group_id: groupId,
      profile_id: userId,
      category_id: category.id,
      amount,
      type: 'expense',
      transaction_date: date,
      is_paid: true,
      payment_status: 'paid',
      note,
      source: 'compras',
      created_by: userId,
    })
    .select('id')
    .single()
  if (error) throw error
  return tx.id
}

export async function createPurchase(admin, auth, payload) {
  const { groupId, userId } = auth
  const { store, storeKind, date, notes, items = [], removeFromList = true, finance } = payload || {}
  if (!Array.isArray(items) || items.length === 0) throw new Error('A compra precisa de ao menos um item.')

  const storeRow = store ? await findOrCreateStore(admin, groupId, userId, store, storeKind) : null
  const resolvedItems = []
  for (const item of items) {
    if (!item?.product) continue
    const product = await findOrCreateProduct(admin, groupId, userId, item.product, item)
    const quantity = Number(item.quantity) || 1
    let unitPrice = item.unit_price != null ? roundMoney(Number(item.unit_price)) : null
    let totalPrice = item.total_price != null ? roundMoney(Number(item.total_price)) : null
    if (unitPrice == null && totalPrice != null && quantity > 0) unitPrice = roundMoney(totalPrice / quantity)
    if (totalPrice == null && unitPrice != null) totalPrice = roundMoney(unitPrice * quantity)
    resolvedItems.push({ product, quantity, unitPrice, totalPrice })
  }
  if (resolvedItems.length === 0) throw new Error('Nenhum item válido na compra.')

  const { data: purchase, error } = await admin
    .from('purchases')
    .insert({
      group_id: groupId,
      store_id: storeRow?.id || null,
      date: date || new Date().toISOString().slice(0, 10),
      notes: notes || null,
      created_by: userId,
    })
    .select('*')
    .single()
  if (error) throw error

  const { error: itemsError } = await admin.from('purchase_items').insert(
    resolvedItems.map((i) => ({
      group_id: groupId,
      purchase_id: purchase.id,
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: i.totalPrice,
    })),
  )
  if (itemsError) throw itemsError

  if (removeFromList) {
    const productIds = resolvedItems.map((i) => i.product.id)
    const norms = resolvedItems.map((i) => nameNorm(i.product.name))
    const { data: pending } = await admin
      .from('shopping_list')
      .select('id, product_id, name')
      .eq('group_id', groupId)
      .eq('done', false)
    const toClose = (pending || []).filter(
      (row) => (row.product_id && productIds.includes(row.product_id)) || norms.includes(nameNorm(row.name)),
    )
    for (const row of toClose) {
      await admin.from('shopping_list').update({ done: true, done_at: new Date().toISOString() }).eq('id', row.id)
    }
  }

  // Padrao do MyDinDin: a compra vira despesa (finance=false desliga).
  if (finance !== false) {
    const total = roundMoney(resolvedItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0))
    if (total > 0) {
      const transactionId = await createFinanceExpense(admin, groupId, userId, {
        amount: total,
        date: purchase.date,
        categoryName: typeof finance === 'object' && finance?.category ? finance.category : 'Mercado',
        note: storeRow ? `Compra em ${storeRow.name}` : 'Compra de mercado',
      })
      await admin.from('purchases').update({ transaction_id: transactionId }).eq('id', purchase.id)
    }
  }

  return getPurchase(admin, groupId, purchase.id)
}

export async function getShoppingPlan(admin, groupId) {
  const [{ data: pending }, comparison, forecasts] = await Promise.all([
    admin.from('shopping_list').select('*, product:products(id, name, unit, consumable)').eq('group_id', groupId).eq('done', false).order('created_at'),
    comparePrices(admin, groupId),
    getForecast(admin, groupId),
  ])
  const priceByProduct = new Map(comparison.map((c) => [c.product.id, c]))
  const forecastByProduct = new Map(forecasts.map((f) => [f.product.id, f.forecast]))
  const items = (pending || []).map((item) => {
    const entry = item.product_id ? priceByProduct.get(item.product_id) : null
    const cheapest = entry?.stores?.[0] || null
    return {
      item,
      estimated_unit_price: cheapest?.price ?? null,
      estimated_total: cheapest ? roundMoney(cheapest.price * (Number(item.quantity) || 1)) : null,
      best_store_id: cheapest?.store_id ?? null,
    }
  })
  const storeCoverage = new Map()
  for (const planItem of items) {
    const entry = planItem.item.product_id ? priceByProduct.get(planItem.item.product_id) : null
    for (const s of entry?.stores || []) {
      if (!storeCoverage.has(s.store_id)) storeCoverage.set(s.store_id, { store_id: s.store_id, items: 0, total: 0 })
      const cov = storeCoverage.get(s.store_id)
      cov.items += 1
      cov.total = roundMoney(cov.total + s.price * (Number(planItem.item.quantity) || 1))
    }
  }
  const runOutDates = items
    .map((i) => (i.item.product_id ? forecastByProduct.get(i.item.product_id)?.run_out_date : null))
    .filter(Boolean)
    .sort()
  return {
    items,
    estimated_total: roundMoney(items.reduce((s, i) => s + (i.estimated_total || 0), 0)),
    best_single_store: [...storeCoverage.values()].sort((a, b) => b.items - a.items || a.total - b.total)[0] || null,
    without_price: items.filter((i) => i.estimated_unit_price == null).map((i) => i.item.name),
    suggested_date: runOutDates[0] || null,
  }
}

export { computeForecast }

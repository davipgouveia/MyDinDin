// Camada de dados do modulo Compras (cliente, via RLS do Supabase).
// Usada pelas telas do modulo e pelas ferramentas do chat.
// A API externa (app/api/compras) implementa as mesmas operacoes no
// servidor, escopadas pelo grupo do token/sessao.
import { supabase } from './supabaseClient'
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

// ---------------- Lojas ----------------

export async function listStores(groupId) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('group_id', groupId)
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function findOrCreateStore(groupId, userId, name, kind) {
  const norm = nameNorm(name)
  const { data: existing } = await supabase
    .from('stores')
    .select('*')
    .eq('group_id', groupId)
    .eq('name_norm', norm)
    .maybeSingle()
  if (existing) return existing
  const { data, error } = await supabase
    .from('stores')
    .insert({ group_id: groupId, name: String(name).trim(), name_norm: norm, kind: kind || 'mercado', created_by: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateStore(id, patch) {
  const updates = { ...patch }
  if (patch.name) updates.name_norm = nameNorm(patch.name)
  const { data, error } = await supabase.from('stores').update(updates).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteStore(id) {
  const { error } = await supabase.from('stores').delete().eq('id', id)
  if (error) throw error
}

// ---------------- Produtos ----------------

export async function listProducts(groupId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('group_id', groupId)
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function findOrCreateProduct(groupId, userId, name, extra = {}) {
  const norm = nameNorm(name)
  const { data: existing } = await supabase
    .from('products')
    .select('*')
    .eq('group_id', groupId)
    .eq('name_norm', norm)
    .maybeSingle()
  if (existing) return existing
  const { data, error } = await supabase
    .from('products')
    .insert({
      group_id: groupId,
      name: String(name).trim(),
      name_norm: norm,
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

export async function updateProduct(id, patch) {
  const updates = { ...patch }
  if (patch.name) updates.name_norm = nameNorm(patch.name)
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ---------------- Compras ----------------

export async function listPurchases(groupId, { limit = 100, since, until, productId, storeId } = {}) {
  let query = supabase
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

export async function getPurchase(groupId, id) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, store:stores(id, name, kind), items:purchase_items(*, product:products(id, name, unit))')
    .eq('group_id', groupId)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Registra uma compra completa: resolve loja e produtos por nome
 * (criando o que nao existe), grava cabecalho e itens, baixa os itens
 * correspondentes da lista e, se pedido, gera a despesa nas financas.
 * Retorna { purchase, transactionId }.
 */
export async function createPurchase(groupId, user, profile, payload) {
  const {
    store,
    storeKind,
    date,
    notes,
    items = [],
    removeFromList = true,
    finance = null, // { categoryName } ou null
  } = payload

  if (!items.length) throw new Error('A compra precisa de ao menos um item.')

  const storeRow = store ? await findOrCreateStore(groupId, user.id, store, storeKind) : null

  const resolvedItems = []
  for (const item of items) {
    const product = await findOrCreateProduct(groupId, user.id, item.product, item)
    const quantity = Number(item.quantity) || 1
    let unitPrice = item.unit_price != null ? roundMoney(Number(item.unit_price)) : null
    let totalPrice = item.total_price != null ? roundMoney(Number(item.total_price)) : null
    if (unitPrice == null && totalPrice != null && quantity > 0) unitPrice = roundMoney(totalPrice / quantity)
    if (totalPrice == null && unitPrice != null) totalPrice = roundMoney(unitPrice * quantity)
    resolvedItems.push({ product, quantity, unitPrice, totalPrice })
  }

  const { data: purchase, error } = await supabase
    .from('purchases')
    .insert({
      group_id: groupId,
      store_id: storeRow?.id || null,
      date: date || new Date().toISOString().slice(0, 10),
      notes: notes || null,
      created_by: user.id,
    })
    .select('*')
    .single()
  if (error) throw error

  const { error: itemsError } = await supabase.from('purchase_items').insert(
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

  // Baixa da lista de compras: itens pendentes com o mesmo produto/nome.
  if (removeFromList) {
    const productIds = resolvedItems.map((i) => i.product.id)
    const norms = resolvedItems.map((i) => nameNorm(i.product.name))
    const { data: pending } = await supabase
      .from('shopping_list')
      .select('id, product_id, name')
      .eq('group_id', groupId)
      .eq('done', false)
    const toClose = (pending || []).filter(
      (row) => (row.product_id && productIds.includes(row.product_id)) || norms.includes(nameNorm(row.name)),
    )
    for (const row of toClose) {
      await supabase
        .from('shopping_list')
        .update({ done: true, done_at: new Date().toISOString() })
        .eq('id', row.id)
    }
  }

  // Integracao com as financas: a compra vira uma despesa.
  let transactionId = null
  if (finance) {
    const total = roundMoney(resolvedItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0))
    if (total > 0) {
      transactionId = await createFinanceExpense(groupId, user, profile, {
        amount: total,
        date: purchase.date,
        categoryName: finance.categoryName || 'Mercado',
        note: storeRow ? `Compra em ${storeRow.name}` : 'Compra de mercado',
      })
      await supabase.from('purchases').update({ transaction_id: transactionId }).eq('id', purchase.id)
      purchase.transaction_id = transactionId
    }
  }

  return { purchase: await getPurchase(groupId, purchase.id), transactionId }
}

// Cria a despesa no modulo financeiro (mesma logica do FinanceContext:
// acha ou cria a categoria pelo nome normalizado).
export async function createFinanceExpense(groupId, user, profile, { amount, date, categoryName, note }) {
  const { data: categories } = await supabase.from('categories').select('id, name').eq('group_id', groupId)
  const target = nameNorm(categoryName)
  let category = (categories || []).find((c) => nameNorm(c.name) === target)
  if (!category) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ group_id: groupId, name: categoryName, created_by: user.id })
      .select('id, name')
      .single()
    if (error) throw error
    category = data
  }
  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      group_id: groupId,
      profile_id: profile?.id || user.id,
      category_id: category.id,
      amount,
      type: 'expense',
      transaction_date: date,
      is_paid: true,
      payment_status: 'paid',
      note,
      source: 'compras',
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error) throw error
  return tx.id
}

export async function updatePurchase(groupId, id, patch) {
  const updates = {}
  if (patch.date) updates.date = patch.date
  if (patch.notes !== undefined) updates.notes = patch.notes
  if (patch.store !== undefined) {
    updates.store_id = patch.store
      ? (await findOrCreateStore(groupId, patch.userId, patch.store, patch.storeKind)).id
      : null
  }
  const { data, error } = await supabase
    .from('purchases')
    .update(updates)
    .eq('id', id)
    .eq('group_id', groupId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deletePurchase(groupId, id) {
  const purchase = await getPurchase(groupId, id)
  const { error } = await supabase.from('purchases').delete().eq('id', id).eq('group_id', groupId)
  if (error) throw error
  // Remove tambem a despesa gerada automaticamente por esta compra.
  if (purchase?.transaction_id) {
    await supabase.from('transactions').delete().eq('id', purchase.transaction_id)
  }
}

export async function addPurchaseItem(groupId, userId, purchaseId, item) {
  const product = await findOrCreateProduct(groupId, userId, item.product, item)
  const quantity = Number(item.quantity) || 1
  let unitPrice = item.unit_price != null ? roundMoney(Number(item.unit_price)) : null
  let totalPrice = item.total_price != null ? roundMoney(Number(item.total_price)) : null
  if (unitPrice == null && totalPrice != null && quantity > 0) unitPrice = roundMoney(totalPrice / quantity)
  if (totalPrice == null && unitPrice != null) totalPrice = roundMoney(unitPrice * quantity)
  const { data, error } = await supabase
    .from('purchase_items')
    .insert({ group_id: groupId, purchase_id: purchaseId, product_id: product.id, quantity, unit_price: unitPrice, total_price: totalPrice })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updatePurchaseItem(itemId, patch) {
  const updates = {}
  if (patch.quantity != null) updates.quantity = Number(patch.quantity)
  if (patch.unit_price !== undefined) updates.unit_price = patch.unit_price != null ? roundMoney(Number(patch.unit_price)) : null
  if (patch.total_price !== undefined) updates.total_price = patch.total_price != null ? roundMoney(Number(patch.total_price)) : null
  if (updates.quantity != null && updates.unit_price != null && patch.total_price === undefined) {
    updates.total_price = roundMoney(updates.quantity * updates.unit_price)
  }
  const { data, error } = await supabase.from('purchase_items').update(updates).eq('id', itemId).select('*').single()
  if (error) throw error
  return data
}

export async function deletePurchaseItem(itemId) {
  const { error } = await supabase.from('purchase_items').delete().eq('id', itemId)
  if (error) throw error
}

// ---------------- Precos ----------------

// Historico de precos de um produto + resumo por loja + mais barata.
export async function productPrices(groupId, productId, { since, until, storeId } = {}) {
  let query = supabase
    .from('purchase_items')
    .select('id, quantity, unit_price, total_price, purchase:purchases!inner(id, date, store_id, store:stores(id, name))')
    .eq('group_id', groupId)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(500)
  const { data, error } = await query
  if (error) throw error
  let rows = (data || []).filter((r) => r.unit_price != null)
  if (since) rows = rows.filter((r) => r.purchase?.date >= since)
  if (until) rows = rows.filter((r) => r.purchase?.date <= until)
  if (storeId) rows = rows.filter((r) => r.purchase?.store_id === storeId)
  rows.sort((a, b) => String(b.purchase?.date).localeCompare(String(a.purchase?.date)))

  const byStore = new Map()
  for (const row of rows) {
    const store = row.purchase?.store
    if (!store) continue
    if (!byStore.has(store.id)) byStore.set(store.id, { store, prices: [] })
    byStore.get(store.id).prices.push(row)
  }
  const storeSummary = [...byStore.values()].map(({ store, prices }) => {
    const latest = prices[0]
    const avg = roundMoney(prices.reduce((s, p) => s + Number(p.unit_price), 0) / prices.length)
    return {
      store,
      last_price: Number(latest.unit_price),
      last_date: latest.purchase?.date,
      avg_price: avg,
      purchases: prices.length,
    }
  }).sort((a, b) => a.last_price - b.last_price)

  return {
    history: rows.map((r) => ({
      date: r.purchase?.date,
      store: r.purchase?.store || null,
      quantity: Number(r.quantity),
      unit_price: Number(r.unit_price),
      total_price: r.total_price != null ? Number(r.total_price) : null,
    })),
    by_store: storeSummary,
    cheapest: storeSummary[0] || null,
  }
}

// Ultimo preco de cada produto em cada loja (comparacao geral).
export async function comparePrices(groupId) {
  const purchases = await listPurchases(groupId, { limit: 500 })
  const latest = new Map() // product_id -> Map(store_id -> {price, date})
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
    const stores = [...perStore.entries()].map(([storeId, v]) => ({ store_id: storeId, ...v }))
    stores.sort((a, b) => a.price - b.price)
    return { product: productsById.get(productId) || { id: productId }, stores, cheapest_store_id: stores[0]?.store_id }
  })
}

// ---------------- "Acabou" e previsao ----------------

export async function markFinished(groupId, userId, productId, date) {
  const { data, error } = await supabase
    .from('finished_events')
    .insert({ group_id: groupId, product_id: productId, date: date || new Date().toISOString().slice(0, 10), created_by: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function unmarkFinished(groupId, productId) {
  const { data } = await supabase
    .from('finished_events')
    .select('id')
    .eq('group_id', groupId)
    .eq('product_id', productId)
    .order('date', { ascending: false })
    .limit(1)
  if (data?.[0]) {
    const { error } = await supabase.from('finished_events').delete().eq('id', data[0].id)
    if (error) throw error
  }
}

export async function loadForecastData(groupId) {
  const [products, purchases, finished] = await Promise.all([
    listProducts(groupId),
    listPurchases(groupId, { limit: 1000 }),
    supabase.from('finished_events').select('*').eq('group_id', groupId).order('date', { ascending: false }),
  ])
  if (finished.error) throw finished.error
  const purchasesByProduct = new Map()
  for (const purchase of purchases) {
    for (const item of purchase.items || []) {
      if (!purchasesByProduct.has(item.product_id)) purchasesByProduct.set(item.product_id, [])
      purchasesByProduct.get(item.product_id).push({ date: purchase.date, quantity: Number(item.quantity) || 0 })
    }
  }
  const finishedByProduct = new Map()
  for (const event of finished.data || []) {
    if (!finishedByProduct.has(event.product_id)) finishedByProduct.set(event.product_id, [])
    finishedByProduct.get(event.product_id).push(event.date)
  }
  return { products, purchasesByProduct, finishedByProduct }
}

export async function getForecast(groupId) {
  const { products, purchasesByProduct, finishedByProduct } = await loadForecastData(groupId)
  return computeAllForecasts(products, purchasesByProduct, finishedByProduct)
}

export async function getProductForecast(groupId, product) {
  const { purchasesByProduct, finishedByProduct } = await loadForecastData(groupId)
  return computeForecast(product, purchasesByProduct.get(product.id) || [], finishedByProduct.get(product.id) || [])
}

// ---------------- Lista de compras ----------------

export async function listShoppingList(groupId, { includeDone = true } = {}) {
  let query = supabase
    .from('shopping_list')
    .select('*, product:products(id, name, unit, consumable)')
    .eq('group_id', groupId)
    .order('done', { ascending: true })
    .order('created_at', { ascending: true })
  if (!includeDone) query = query.eq('done', false)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function addListItem(groupId, user, { name, product, quantity, notes }) {
  let productRow = null
  if (product) productRow = await findOrCreateProduct(groupId, user.id, product)
  const { data, error } = await supabase
    .from('shopping_list')
    .insert({
      group_id: groupId,
      product_id: productRow?.id || null,
      name: String(product || name || '').trim(),
      quantity: Number(quantity) || 1,
      notes: notes || null,
      created_by: user.id,
    })
    .select('*, product:products(id, name, unit, consumable)')
    .single()
  if (error) throw error
  return data
}

export async function updateListItem(id, patch) {
  const updates = { ...patch }
  if (updates.done === true && !updates.done_at) updates.done_at = new Date().toISOString()
  if (updates.done === false) updates.done_at = null
  const { data, error } = await supabase
    .from('shopping_list')
    .update(updates)
    .eq('id', id)
    .select('*, product:products(id, name, unit, consumable)')
    .single()
  if (error) throw error
  return data
}

export async function deleteListItem(id) {
  const { error } = await supabase.from('shopping_list').delete().eq('id', id)
  if (error) throw error
}

export async function clearShoppingList(groupId, { onlyDone = false } = {}) {
  let query = supabase.from('shopping_list').delete().eq('group_id', groupId)
  if (onlyDone) query = query.eq('done', true)
  const { error } = await query
  if (error) throw error
}

// Adiciona a lista tudo que deve acabar em ate N dias (sem duplicar pendentes).
export async function addForecastToList(groupId, user, withinDays = 7) {
  const forecasts = await getForecast(groupId)
  const pending = await listShoppingList(groupId, { includeDone: false })
  const pendingProducts = new Set(pending.map((i) => i.product_id).filter(Boolean))
  const pendingNames = new Set(pending.map((i) => nameNorm(i.name)))
  let added = 0
  for (const { product, forecast } of forecasts) {
    if (forecast.status === 'sem_dados') continue
    if (forecast.days_left != null && forecast.days_left > withinDays) continue
    if (pendingProducts.has(product.id) || pendingNames.has(nameNorm(product.name))) continue
    await addListItem(groupId, user, { product: product.name, quantity: 1 })
    added += 1
  }
  return added
}

// Plano da proxima compra: melhor loja por item, custo estimado,
// melhor loja unica e data sugerida (menor data de termino da lista).
export async function getShoppingPlan(groupId) {
  const [pending, comparison, forecasts] = await Promise.all([
    listShoppingList(groupId, { includeDone: false }),
    comparePrices(groupId),
    getForecast(groupId),
  ])
  const priceByProduct = new Map(comparison.map((c) => [c.product.id, c]))
  const forecastByProduct = new Map(forecasts.map((f) => [f.product.id, f.forecast]))

  const items = pending.map((item) => {
    const entry = item.product_id ? priceByProduct.get(item.product_id) : null
    const cheapest = entry?.stores?.[0] || null
    return {
      item,
      estimated_unit_price: cheapest?.price ?? null,
      estimated_total: cheapest ? roundMoney(cheapest.price * (Number(item.quantity) || 1)) : null,
      best_store_id: cheapest?.store_id ?? null,
    }
  })

  const estimatedTotal = roundMoney(items.reduce((s, i) => s + (i.estimated_total || 0), 0))
  const withoutPrice = items.filter((i) => i.estimated_unit_price == null).map((i) => i.item.name)

  // Melhor loja unica: a que cobre mais itens pendentes pelo menor custo.
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
  const bestSingleStore = [...storeCoverage.values()].sort((a, b) => b.items - a.items || a.total - b.total)[0] || null

  const runOutDates = items
    .map((i) => (i.item.product_id ? forecastByProduct.get(i.item.product_id)?.run_out_date : null))
    .filter(Boolean)
    .sort()

  return {
    items,
    estimated_total: estimatedTotal,
    best_single_store: bestSingleStore,
    without_price: withoutPrice,
    suggested_date: runOutDates[0] || null,
  }
}

// ---------------- Gastos ----------------

export async function getSpending(groupId, { groupBy = 'month', since, until } = {}) {
  const purchases = await listPurchases(groupId, { limit: 5000, since, until })
  const totals = new Map()
  for (const purchase of purchases) {
    const total = purchaseTotal(purchase)
    let key
    if (groupBy === 'store') key = purchase.store?.name || 'Sem loja'
    else if (groupBy === 'category') key = 'Compras' // categorias sao por produto; ver relatorios
    else key = String(purchase.date).slice(0, 7)
    totals.set(key, roundMoney((totals.get(key) || 0) + total))
  }
  return [...totals.entries()]
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => (groupBy === 'month' ? a.key.localeCompare(b.key) : b.total - a.total))
}

// ---------------- Busca e visao geral ----------------

export async function searchAll(groupId, q) {
  const norm = nameNorm(q)
  if (!norm) return { products: [], stores: [] }
  const [products, stores] = await Promise.all([listProducts(groupId), listStores(groupId)])
  return {
    products: products.filter((p) => p.name_norm.includes(norm)),
    stores: stores.filter((s) => s.name_norm.includes(norm)),
  }
}

export async function getOverview(groupId) {
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const [pending, forecasts, monthPurchases] = await Promise.all([
    listShoppingList(groupId, { includeDone: false }),
    getForecast(groupId),
    listPurchases(groupId, { limit: 500, since: monthStart }),
  ])
  const monthSpending = roundMoney(monthPurchases.reduce((s, p) => s + purchaseTotal(p), 0))
  return {
    pending_list: pending,
    running_out: forecasts.filter((f) => f.forecast.status === 'acabando' || f.forecast.status === 'acabou'),
    month_spending: monthSpending,
  }
}

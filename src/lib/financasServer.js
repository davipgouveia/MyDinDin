// API de Financas do MyDinDin (somente leitura): lancamentos, categorias,
// orcamentos, contas a pagar/receber e series mensais do grupo.
// Usada pelas rotas app/api/financas com a mesma autenticacao da API de
// Compras (sessao do app ou token pessoal mdd_...). Tudo escopado por grupo.
import { roundMoney } from '../utils/format'

const TX_SELECT =
  'id, amount, type, transaction_date, due_date, is_paid, payment_status, payment_method, note, notes, source, profile_id, created_by, created_at, category:categories(id, name, icon, color)'

export function monthBounds(month) {
  const m = /^(\d{4})-(\d{2})$/.test(month || '') ? month : null
  const now = new Date()
  const year = m ? Number(m.slice(0, 4)) : now.getFullYear()
  const mon = m ? Number(m.slice(5, 7)) : now.getMonth() + 1
  const start = `${year}-${String(mon).padStart(2, '0')}-01`
  const next = new Date(Date.UTC(year, mon, 1))
  const end = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`
  return { month: start.slice(0, 7), start, end }
}

async function categoryMap(admin, groupId) {
  const { data } = await admin.from('categories').select('id, name, icon, color').eq('group_id', groupId)
  const map = new Map()
  ;(data || []).forEach((c) => map.set(c.id, c))
  return map
}

async function monthTransactions(admin, groupId, month) {
  const { start, end } = monthBounds(month)
  const { data, error } = await admin
    .from('transactions')
    .select('amount, type, category_id, is_paid')
    .eq('group_id', groupId)
    .gte('transaction_date', start)
    .lt('transaction_date', end)
  if (error) throw new Error(error.message)
  return data || []
}

function sumByType(rows) {
  let income = 0
  let expense = 0
  rows.forEach((t) => {
    if (t.type === 'income') income += Number(t.amount) || 0
    else expense += Number(t.amount) || 0
  })
  return { income: roundMoney(income), expense: roundMoney(expense), balance: roundMoney(income - expense) }
}

export async function listTransactions(admin, groupId, { month, type, category, paid, q, limit = 100, offset = 0 } = {}) {
  const lim = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500)
  const off = Math.max(parseInt(offset, 10) || 0, 0)
  let query = admin
    .from('transactions')
    .select(TX_SELECT, { count: 'exact' })
    .eq('group_id', groupId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(off, off + lim - 1)

  if (month) {
    const { start, end } = monthBounds(month)
    query = query.gte('transaction_date', start).lt('transaction_date', end)
  }
  if (type === 'income' || type === 'expense') query = query.eq('type', type)
  if (paid === true || paid === false) query = query.eq('is_paid', paid)
  if (category) {
    const map = await categoryMap(admin, groupId)
    let categoryId = null
    if (map.has(category)) categoryId = category
    else {
      const wanted = String(category).trim().toLowerCase()
      for (const c of map.values()) if (c.name.toLowerCase() === wanted) categoryId = c.id
    }
    if (!categoryId) return { transactions: [], total: 0 }
    query = query.eq('category_id', categoryId)
  }
  if (q) {
    const safe = String(q).replace(/[,%()]/g, ' ').trim()
    if (safe) query = query.or(`note.ilike.%${safe}%,notes.ilike.%${safe}%`)
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)
  return { transactions: data || [], total: count || 0 }
}

export async function financeOverview(admin, groupId, month) {
  const { month: m } = monthBounds(month)
  const [rows, recent, bills] = await Promise.all([
    monthTransactions(admin, groupId, m),
    listTransactions(admin, groupId, { month: m, limit: 10 }),
    listBills(admin, groupId),
  ])
  const totals = sumByType(rows)
  const map = await categoryMap(admin, groupId)
  const byCategory = new Map()
  rows
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const key = t.category_id || 'sem_categoria'
      byCategory.set(key, (byCategory.get(key) || 0) + (Number(t.amount) || 0))
    })
  const topCategories = [...byCategory.entries()]
    .map(([id, total]) => ({
      category: map.get(id)?.name || 'Sem categoria',
      total: roundMoney(total),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  return {
    month: m,
    income: totals.income,
    expense: totals.expense,
    balance: totals.balance,
    transactions_count: rows.length,
    top_expense_categories: topCategories,
    pending_bills: {
      overdue_count: bills.overdue.length,
      overdue_total: bills.overdue_total,
      upcoming_count: bills.upcoming.length,
      upcoming_total: bills.upcoming_total,
    },
    recent_transactions: recent.transactions,
  }
}

export async function categoriesWithTotals(admin, groupId, month) {
  const { month: m, start } = monthBounds(month)
  const [map, rows, budgets] = await Promise.all([
    categoryMap(admin, groupId),
    monthTransactions(admin, groupId, m),
    admin.from('budgets').select('category_id, limit_amount, alert_threshold_percent').eq('group_id', groupId).eq('month_start', start),
  ])
  const totals = new Map()
  rows.forEach((t) => {
    if (!t.category_id) return
    const cur = totals.get(t.category_id) || { income: 0, expense: 0 }
    if (t.type === 'income') cur.income += Number(t.amount) || 0
    else cur.expense += Number(t.amount) || 0
    totals.set(t.category_id, cur)
  })
  const budgetByCategory = new Map((budgets.data || []).map((b) => [b.category_id, b]))
  return [...map.values()].map((c) => {
    const t = totals.get(c.id) || { income: 0, expense: 0 }
    const b = budgetByCategory.get(c.id)
    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      income: roundMoney(t.income),
      expense: roundMoney(t.expense),
      budget: b
        ? {
            limit: roundMoney(Number(b.limit_amount)),
            spent: roundMoney(t.expense),
            percent_used: Math.round((t.expense / Number(b.limit_amount)) * 100),
            alert_threshold_percent: b.alert_threshold_percent,
          }
        : null,
    }
  })
}

export async function listBudgets(admin, groupId, month) {
  const { month: m, start } = monthBounds(month)
  const [budgets, rows, map] = await Promise.all([
    admin.from('budgets').select('id, category_id, limit_amount, alert_threshold_percent').eq('group_id', groupId).eq('month_start', start),
    monthTransactions(admin, groupId, m),
    categoryMap(admin, groupId),
  ])
  const spent = new Map()
  rows
    .filter((t) => t.type === 'expense' && t.category_id)
    .forEach((t) => spent.set(t.category_id, (spent.get(t.category_id) || 0) + (Number(t.amount) || 0)))
  return (budgets.data || []).map((b) => {
    const s = spent.get(b.category_id) || 0
    const limit = Number(b.limit_amount) || 0
    return {
      id: b.id,
      category: map.get(b.category_id)?.name || 'Categoria removida',
      category_id: b.category_id,
      month: m,
      limit: roundMoney(limit),
      spent: roundMoney(s),
      remaining: roundMoney(limit - s),
      percent_used: limit > 0 ? Math.round((s / limit) * 100) : 0,
      alert_threshold_percent: b.alert_threshold_percent,
    }
  })
}

export async function listBills(admin, groupId) {
  const { data, error } = await admin
    .from('transactions')
    .select(TX_SELECT)
    .eq('group_id', groupId)
    .eq('is_paid', false)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw new Error(error.message)
  const today = new Date().toISOString().slice(0, 10)
  const overdue = []
  const upcoming = []
  ;(data || []).forEach((t) => {
    if (t.due_date && t.due_date < today) overdue.push(t)
    else upcoming.push(t)
  })
  const total = (list) => roundMoney(list.reduce((s, t) => s + (Number(t.amount) || 0), 0))
  return {
    overdue,
    upcoming,
    overdue_total: total(overdue.filter((t) => t.type === 'expense')),
    upcoming_total: total(upcoming.filter((t) => t.type === 'expense')),
  }
}

export async function monthlySeries(admin, groupId, months = 6) {
  const n = Math.min(Math.max(parseInt(months, 10) || 6, 1), 24)
  const now = new Date()
  const first = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (n - 1), 1))
  const start = `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, '0')}-01`
  const { data, error } = await admin
    .from('transactions')
    .select('amount, type, transaction_date')
    .eq('group_id', groupId)
    .gte('transaction_date', start)
  if (error) throw new Error(error.message)
  const acc = new Map()
  ;(data || []).forEach((t) => {
    const key = String(t.transaction_date).slice(0, 7)
    const cur = acc.get(key) || { income: 0, expense: 0 }
    if (t.type === 'income') cur.income += Number(t.amount) || 0
    else cur.expense += Number(t.amount) || 0
    acc.set(key, cur)
  })
  const out = []
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const cur = acc.get(key) || { income: 0, expense: 0 }
    out.push({ month: key, income: roundMoney(cur.income), expense: roundMoney(cur.expense), balance: roundMoney(cur.income - cur.expense) })
  }
  return out
}

export async function groupInfo(admin, groupId) {
  const [{ data: group }, { data: members }] = await Promise.all([
    admin.from('family_groups').select('id, name, created_at').eq('id', groupId).single(),
    admin.from('profiles').select('id, full_name, role, created_at').eq('group_id', groupId).order('created_at'),
  ])
  return { group: group || null, members: members || [] }
}

/* ------------------------------------------------------------------ */
/* Escrita (v2.15.0): o token tambem altera as financas do grupo.      */
/* ------------------------------------------------------------------ */

import { nameNorm } from './comprasServer'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

async function resolveCategoryForWrite(admin, groupId, userId, ref) {
  if (!ref) return null
  const map = await categoryMap(admin, groupId)
  if (map.has(ref)) return map.get(ref)
  const wanted = nameNorm(ref)
  for (const c of map.values()) if (nameNorm(c.name) === wanted) return c
  const { data, error } = await admin
    .from('categories')
    .insert({ group_id: groupId, name: String(ref).trim(), created_by: userId })
    .select('id, name, icon, color')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getTransaction(admin, groupId, id) {
  const { data } = await admin.from('transactions').select(TX_SELECT).eq('group_id', groupId).eq('id', id).maybeSingle()
  return data || null
}

export async function createTransaction(admin, groupId, userId, body = {}) {
  const amount = Number(body.amount)
  if (!amount || amount <= 0) throw new Error('Informe "amount" maior que zero.')
  if (body.type !== 'income' && body.type !== 'expense') throw new Error('Informe "type": "income" ou "expense".')
  const category = await resolveCategoryForWrite(admin, groupId, userId, body.category)
  const isPaid = body.is_paid !== false
  const { data, error } = await admin
    .from('transactions')
    .insert({
      group_id: groupId,
      profile_id: userId,
      category_id: category ? category.id : null,
      amount: roundMoney(amount),
      type: body.type,
      transaction_date: DATE_RE.test(body.date || '') ? body.date : new Date().toISOString().slice(0, 10),
      due_date: DATE_RE.test(body.due_date || '') ? body.due_date : null,
      is_paid: isPaid,
      payment_status: body.payment_status || (isPaid ? 'paid' : 'pending'),
      payment_method: body.payment_method || null,
      note: body.note || null,
      notes: body.notes || null,
      source: 'api',
      created_by: userId,
    })
    .select(TX_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateTransaction(admin, groupId, userId, id, body = {}) {
  const existing = await getTransaction(admin, groupId, id)
  if (!existing) return null
  const patch = {}
  if (body.amount !== undefined) {
    const a = Number(body.amount)
    if (!a || a <= 0) throw new Error('"amount" deve ser maior que zero.')
    patch.amount = roundMoney(a)
  }
  if (body.type === 'income' || body.type === 'expense') patch.type = body.type
  if (DATE_RE.test(body.date || '')) patch.transaction_date = body.date
  if (body.due_date !== undefined) patch.due_date = DATE_RE.test(body.due_date || '') ? body.due_date : null
  if (typeof body.is_paid === 'boolean') {
    patch.is_paid = body.is_paid
    if (body.payment_status === undefined) patch.payment_status = body.is_paid ? 'paid' : 'pending'
  }
  if (body.payment_status !== undefined) patch.payment_status = body.payment_status
  if (body.payment_method !== undefined) patch.payment_method = body.payment_method
  if (body.note !== undefined) patch.note = body.note
  if (body.notes !== undefined) patch.notes = body.notes
  if (body.category !== undefined) {
    const c = await resolveCategoryForWrite(admin, groupId, userId, body.category)
    patch.category_id = c ? c.id : null
  }
  if (!Object.keys(patch).length) throw new Error('Nada para atualizar: envie ao menos um campo.')
  patch.updated_at = new Date().toISOString()
  const { data, error } = await admin
    .from('transactions')
    .update(patch)
    .eq('group_id', groupId)
    .eq('id', id)
    .select(TX_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteTransaction(admin, groupId, id) {
  // Despesa gerada por uma compra: desvincula a compra antes de apagar.
  await admin.from('purchases').update({ transaction_id: null }).eq('group_id', groupId).eq('transaction_id', id)
  const { data, error } = await admin.from('transactions').delete().eq('group_id', groupId).eq('id', id).select('id')
  if (error) throw new Error(error.message)
  return (data || []).length > 0
}

export async function upsertBudget(admin, groupId, userId, body = {}) {
  if (!body.category) throw new Error('Informe "category" (nome ou id).')
  const limit = Number(body.limit ?? body.limit_amount)
  if (!limit || limit <= 0) throw new Error('Informe "limit" maior que zero.')
  const category = await resolveCategoryForWrite(admin, groupId, userId, body.category)
  const { month, start } = monthBounds(body.month)
  const { error } = await admin.from('budgets').upsert(
    {
      group_id: groupId,
      category_id: category.id,
      month_start: start,
      limit_amount: roundMoney(limit),
      alert_threshold_percent: body.alert_threshold_percent ?? 80,
      created_by: userId,
    },
    { onConflict: 'group_id,category_id,month_start' },
  )
  if (error) throw new Error(error.message)
  const budgets = await listBudgets(admin, groupId, month)
  return budgets.find((b) => b.category_id === category.id) || null
}

export async function deleteBudget(admin, groupId, id) {
  const { data, error } = await admin.from('budgets').delete().eq('group_id', groupId).eq('id', id).select('id')
  if (error) throw new Error(error.message)
  return (data || []).length > 0
}

export async function createCategory(admin, groupId, userId, body = {}) {
  const name = String(body.name || '').trim()
  if (!name) throw new Error('Informe "name" da categoria.')
  const { data, error } = await admin
    .from('categories')
    .insert({ group_id: groupId, name, icon: body.icon || null, color: body.color || null, created_by: userId })
    .select('id, name, icon, color')
    .single()
  if (error) throw new Error(error.message)
  return data
}

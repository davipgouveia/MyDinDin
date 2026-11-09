import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { buildWeeklySummaryEmail } from '../../../../src/lib/emailTemplates'
import { getPublicAppUrl } from '../../../../src/lib/publicAppUrl'

// Resumo semanal por e-mail (anti-desuso): roda via Vercel Cron aos
// domingos. Protegida por CRON_SECRET — sem o segredo configurado, a
// rota nao envia nada. Grupos sem lancamentos na semana sao pulados.

const DAY_MS = 24 * 60 * 60 * 1000

const toISODate = (date) => date.toISOString().slice(0, 10)
const toBRDate = (iso) => {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })

  return response.ok
}

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET nao configurado no servidor.' },
      { status: 503 },
    )
  }

  const authorization = request.headers.get('authorization') || ''
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase admin nao configurado.' },
      { status: 503 },
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const now = new Date()
  const endISO = toISODate(now)
  const startISO = toISODate(new Date(now.getTime() - 7 * DAY_MS))
  const weekLabel = `${toBRDate(startISO)} a ${toBRDate(endISO)}`

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, group_id')
    .not('group_id', 'is', null)

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const { data: transactions, error: transactionsError } = await supabaseAdmin
    .from('transactions')
    .select('group_id, amount, type, category:categories(name)')
    .gte('transaction_date', startISO)
    .lte('transaction_date', endISO)

  if (transactionsError) {
    return NextResponse.json({ error: transactionsError.message }, { status: 500 })
  }

  const emailByUserId = new Map()
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) break
    const users = data?.users ?? []
    users.forEach((authUser) => {
      if (authUser?.id && authUser?.email) emailByUserId.set(authUser.id, authUser.email)
    })
    if (users.length < 200) break
  }

  const statsByGroup = new Map()
  ;(transactions ?? []).forEach((tx) => {
    if (!statsByGroup.has(tx.group_id)) {
      statsByGroup.set(tx.group_id, { income: 0, expense: 0, count: 0, byCategory: new Map() })
    }
    const stats = statsByGroup.get(tx.group_id)
    const amount = Math.abs(Number(tx.amount) || 0)
    stats.count += 1
    if (tx.type === 'income') {
      stats.income += amount
    } else {
      stats.expense += amount
      const categoryName = tx.category?.name ?? 'Outros'
      stats.byCategory.set(categoryName, (stats.byCategory.get(categoryName) || 0) + amount)
    }
  })

  const membersByGroup = new Map()
  ;(profiles ?? []).forEach((profile) => {
    if (!membersByGroup.has(profile.group_id)) membersByGroup.set(profile.group_id, [])
    membersByGroup.get(profile.group_id).push(profile.id)
  })

  let sent = 0
  let groupsWithActivity = 0

  for (const [groupId, stats] of statsByGroup.entries()) {
    if (stats.count === 0) continue
    groupsWithActivity += 1

    const topCategory = [...stats.byCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const html = buildWeeklySummaryEmail({
      weekLabel,
      income: stats.income,
      expense: stats.expense,
      balance: stats.income - stats.expense,
      topCategory,
      actionUrl: getPublicAppUrl(),
    })

    const memberIds = membersByGroup.get(groupId) ?? []
    for (const memberId of memberIds) {
      const email = emailByUserId.get(memberId)
      if (!email) continue
      const ok = await sendEmail({
        to: email,
        subject: 'Seu resumo da semana — MyDinDin',
        html,
      })
      if (ok) sent += 1
    }
  }

  return NextResponse.json({ ok: true, sent, groupsWithActivity, weekLabel })
}

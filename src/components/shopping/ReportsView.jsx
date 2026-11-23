"use client"

import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import * as shop from '../../lib/shopping'
import { formatCurrency } from '../../utils/format'

const PALETTE = ['#06b6d4', '#22c55e', '#f97316', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8']

const REPORTS = [
  { id: 'mais_comprados', label: 'Mais comprados', format: (v) => `${v}×` },
  { id: 'menos_comprados', label: 'Menos comprados', format: (v) => `${v}×` },
  { id: 'mais_caros', label: 'Ficaram mais caros', format: (v) => `+${v}%` },
  { id: 'mais_baratos', label: 'Ficaram mais baratos', format: (v) => `${v}%` },
  { id: 'onde_mais_gastei', label: 'Onde mais gastei', format: (v) => formatCurrency(v) },
  { id: 'gasto_por_loja', label: 'Gasto por loja', format: (v) => formatCurrency(v) },
  { id: 'duraram_mais', label: 'Duraram mais', format: (v) => `${v} dias/un` },
  { id: 'duraram_menos', label: 'Duraram menos', format: (v) => `${v} dias/un` },
]

const PERIODS = [
  { id: 30, label: '30 dias' },
  { id: 90, label: '90 dias' },
  { id: 365, label: '1 ano' },
  { id: 0, label: 'Tudo' },
]

export function ReportsView({ groupId, forecasts, panelClass, toast }) {
  const [reportId, setReportId] = useState('mais_comprados')
  const [format, setFormat] = useState('barras')
  const [period, setPeriod] = useState(0)
  const [allPurchases, setAllPurchases] = useState([])

  useEffect(() => {
    shop.listPurchases(groupId, { limit: 5000 }).then(setAllPurchases).catch((err) => toast.error(err.message))
  }, [groupId, toast])

  const report = REPORTS.find((r) => r.id === reportId)

  const data = useMemo(() => {
    if (reportId === 'duraram_mais' || reportId === 'duraram_menos') {
      const rows = forecasts
        .filter((f) => f.forecast.days_per_unit)
        .map((f) => ({ name: f.product.name, value: Math.round(f.forecast.days_per_unit * 10) / 10 }))
      rows.sort((a, b) => (reportId === 'duraram_mais' ? b.value - a.value : a.value - b.value))
      return rows.slice(0, 8)
    }

    let purchases = allPurchases
    if (period > 0) {
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      purchases = purchases.filter((p) => p.date >= since)
    }
    purchases = [...purchases].sort((a, b) => String(a.date).localeCompare(String(b.date)))

    if (reportId === 'gasto_por_loja') {
      const totals = new Map()
      for (const p of purchases) {
        const key = p.store?.name || 'Sem loja'
        totals.set(key, (totals.get(key) || 0) + shop.purchaseTotal(p))
      }
      return [...totals.entries()].map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
        .sort((a, b) => b.value - a.value).slice(0, 8)
    }

    // Agregados por produto.
    const perProduct = new Map()
    for (const p of purchases) {
      for (const item of p.items || []) {
        const name = item.product?.name || 'Produto'
        if (!perProduct.has(name)) perProduct.set(name, { count: 0, total: 0, prices: [] })
        const agg = perProduct.get(name)
        agg.count += 1
        agg.total += shop.itemTotal(item)
        if (item.unit_price != null) agg.prices.push(Number(item.unit_price))
      }
    }

    if (reportId === 'mais_comprados') {
      return [...perProduct.entries()].map(([name, a]) => ({ name, value: a.count }))
        .sort((a, b) => b.value - a.value).slice(0, 8)
    }
    if (reportId === 'menos_comprados') {
      return [...perProduct.entries()].map(([name, a]) => ({ name, value: a.count }))
        .sort((a, b) => a.value - b.value || a.name.localeCompare(b.name)).slice(0, 8)
    }
    if (reportId === 'onde_mais_gastei') {
      return [...perProduct.entries()].map(([name, a]) => ({ name, value: Math.round(a.total * 100) / 100 }))
        .sort((a, b) => b.value - a.value).slice(0, 8)
    }
    // Variacao de preco: primeira x ultima compra com preco no periodo.
    const variations = []
    for (const [name, a] of perProduct.entries()) {
      if (a.prices.length < 2) continue
      const first = a.prices[0]
      const last = a.prices[a.prices.length - 1]
      if (!first) continue
      const pct = Math.round(((last - first) / first) * 1000) / 10
      variations.push({ name, value: pct })
    }
    if (reportId === 'mais_caros') return variations.filter((v) => v.value > 0).sort((a, b) => b.value - a.value).slice(0, 8)
    if (reportId === 'mais_baratos') return variations.filter((v) => v.value < 0).sort((a, b) => a.value - b.value).slice(0, 8)
    return []
  }, [allPurchases, forecasts, period, reportId])

  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)))

  return (
    <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={reportId}
          onChange={(e) => setReportId(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm font-semibold outline-none"
        >
          {REPORTS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <div className="flex overflow-hidden rounded-xl border border-slate-700">
          {['barras', 'pizza'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`px-3 py-2 text-xs font-bold capitalize ${format === f ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
        {!reportId.startsWith('duraram') && (
          <div className="flex overflow-hidden rounded-xl border border-slate-700">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-2 text-xs font-bold ${period === p.id ? 'bg-cyan-400 text-slate-950' : 'text-slate-300'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          Sem dados para este relatório ainda. Registre mais compras para ele ganhar vida.
        </p>
      ) : format === 'barras' ? (
        <ul className="mt-5 space-y-3">
          {data.map((row, i) => (
            <li key={row.name}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{row.name}</span>
                <span className="shrink-0 font-bold" style={{ color: PALETTE[i % PALETTE.length] }}>
                  {report.format(row.value)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(3, (Math.abs(row.value) / max) * 100)}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 grid items-center gap-4 md:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                  {data.map((row, i) => (
                    <Cell key={row.name} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => report.format(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {data.map((row, i) => (
              <li key={row.name} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 shrink-0 rounded" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                <span className="flex-1 truncate">{row.name}</span>
                <span className="font-bold">{report.format(row.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

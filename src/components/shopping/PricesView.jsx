"use client"

import { useEffect, useMemo, useState } from 'react'
import { Search, Trophy } from 'lucide-react'
import * as shop from '../../lib/shopping'
import { formatCurrency } from '../../utils/format'
import { fmtDate } from './ShoppingModule'

export function PricesView({ groupId, products, stores, panelClass, panelSoftClass, toast }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [prices, setPrices] = useState(null)
  const [comparison, setComparison] = useState([])

  const storeName = (id) => stores.find((s) => s.id === id)?.name || 'Loja'

  useEffect(() => {
    shop.comparePrices(groupId).then(setComparison).catch(() => {})
  }, [groupId])

  const results = useMemo(() => {
    const norm = shop.nameNorm(query)
    if (!norm) return []
    return products.filter((p) => p.name_norm.includes(norm)).slice(0, 8)
  }, [products, query])

  async function select(product) {
    setSelected(product)
    setPrices(null)
    try {
      setPrices(await shop.productPrices(groupId, product.id))
    } catch (err) {
      toast.error(err.message || 'Não foi possível carregar os preços.')
    }
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto para comparar preços…"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
          />
        </div>
        {results.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => select(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  selected?.id === p.id
                    ? 'bg-cyan-400 text-slate-950'
                    : 'border border-slate-700 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="mt-4">
            <h3 className="text-base font-bold">{selected.name}</h3>
            {!prices ? (
              <p className="mt-2 text-sm text-slate-400">Carregando preços…</p>
            ) : prices.history.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Nenhum preço registrado para este produto ainda.</p>
            ) : (
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Por loja</p>
                  <ul className="space-y-2">
                    {prices.by_store.map((row, index) => (
                      <li key={row.store.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${panelSoftClass}`}>
                        {index === 0 && <Trophy size={15} className="shrink-0 text-amber-300" />}
                        <span className="flex-1 truncate font-medium">{row.store.name}</span>
                        <span className="text-xs text-slate-500">média {formatCurrency(row.avg_price)}</span>
                        <span className="font-bold text-cyan-300">{formatCurrency(row.last_price)}</span>
                      </li>
                    ))}
                  </ul>
                  {prices.cheapest && (
                    <p className="mt-2 text-xs text-slate-400">
                      Mais barato hoje: <strong className="text-slate-200">{prices.cheapest.store.name}</strong> a{' '}
                      {formatCurrency(prices.cheapest.last_price)}/{selected.unit || 'un'}.
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Histórico</p>
                  <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                    {prices.history.map((row, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-20 shrink-0 text-xs text-slate-500">{fmtDate(row.date)}</span>
                        <span className="flex-1 truncate text-slate-300">{row.store?.name || 'Sem loja'}</span>
                        <span className="font-semibold">{formatCurrency(row.unit_price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {comparison.length > 0 && (
        <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Comparação geral — último preço por loja</h3>
          <ul className="divide-y divide-slate-800">
            {comparison.map(({ product, stores: perStore }) => (
              <li key={product.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                <span className="min-w-[140px] flex-1 truncate font-medium">{product.name}</span>
                {perStore.map((s) => (
                  <span
                    key={s.store_id}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      s.store_id === perStore[0].store_id
                        ? 'bg-emerald-500/15 font-bold text-emerald-300'
                        : 'bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    {storeName(s.store_id)}: {formatCurrency(s.price)}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

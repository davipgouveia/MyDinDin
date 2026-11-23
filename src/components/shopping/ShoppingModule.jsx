"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, ListChecks, Hourglass, ReceiptText, History,
  Tags, Store, ChartColumnBig, KeyRound, RefreshCw,
} from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { toast } from '../../hooks/useToast'
import * as shop from '../../lib/shopping'
import { ListView } from './ListView'
import { ForecastView } from './ForecastView'
import { PurchaseForm } from './PurchaseForm'
import { HistoryView } from './HistoryView'
import { PricesView } from './PricesView'
import { CatalogView } from './CatalogView'
import { ReportsView } from './ReportsView'
import { ApiView } from './ApiView'

const TABS = [
  { id: 'lista', label: 'Lista', icon: ListChecks },
  { id: 'acabando', label: 'Acabando', icon: Hourglass },
  { id: 'registrar', label: 'Registrar', icon: ReceiptText },
  { id: 'historico', label: 'Histórico', icon: History },
  { id: 'precos', label: 'Preços', icon: Tags },
  { id: 'catalogo', label: 'Produtos e Lojas', icon: Store },
  { id: 'relatorios', label: 'Relatórios', icon: ChartColumnBig },
  { id: 'api', label: 'API e Muse', icon: KeyRound },
]

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR')
}

export function ShoppingModule({ panelClass, panelSoftClass }) {
  const { user, profile, group, members } = useFinance()
  const groupId = profile?.group_id || group?.id
  const [tab, setTab] = useState('lista')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [purchases, setPurchases] = useState([])
  const [listItems, setListItems] = useState([])
  const [forecasts, setForecasts] = useState([])

  const memberName = useCallback(
    (userId) => {
      if (!userId) return 'Alguém'
      if (userId === user?.id) return 'Você'
      const member = (members || []).find((m) => m.id === userId)
      return member?.full_name || member?.name || 'Membro do grupo'
    },
    [members, user],
  )

  const reload = useCallback(async () => {
    if (!groupId) return
    setError(null)
    try {
      const [storesData, productsData, purchasesData, listData, forecastData] = await Promise.all([
        shop.listStores(groupId),
        shop.listProducts(groupId),
        shop.listPurchases(groupId, { limit: 500 }),
        shop.listShoppingList(groupId, { includeDone: true }),
        shop.getForecast(groupId),
      ])
      setStores(storesData)
      setProducts(productsData)
      setPurchases(purchasesData)
      setListItems(listData)
      setForecasts(forecastData)
    } catch (err) {
      setError(err.message || 'Não foi possível carregar o módulo de compras.')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    reload()
  }, [reload])

  const ctx = useMemo(
    () => ({
      user,
      profile,
      groupId,
      stores,
      products,
      purchases,
      listItems,
      forecasts,
      memberName,
      reload,
      panelClass,
      panelSoftClass,
      toast,
    }),
    [user, profile, groupId, stores, products, purchases, listItems, forecasts, memberName, reload, panelClass, panelSoftClass],
  )

  const runningOutCount = forecasts.filter(
    (f) => f.forecast.status === 'acabando' || f.forecast.status === 'acabou',
  ).length
  const pendingCount = listItems.filter((i) => !i.done).length

  return (
    <section className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.07] p-2.5">
              <ShoppingCart size={22} className="text-cyan-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Compras da casa</h2>
              <p className="text-xs text-slate-400">
                Lista compartilhada do grupo, preços, previsão de estoque e histórico.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reload}
            className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            const badge = item.id === 'lista' ? pendingCount : item.id === 'acabando' ? runningOutCount : 0
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-cyan-400 text-slate-950'
                    : 'border border-slate-700 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300'
                }`}
              >
                <Icon size={14} />
                {item.label}
                {badge > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-slate-950/20' : 'bg-rose-500/20 text-rose-300'}`}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-200">
          {error}
          <span className="mt-1 block text-xs text-rose-300/80">
            Se as tabelas do módulo ainda não existirem, a migration 008 precisa ser aplicada no Supabase.
          </span>
        </div>
      )}

      {loading ? (
        <div className={`rounded-[1.75rem] border p-8 text-center text-sm text-slate-400 ${panelClass}`}>
          Carregando compras…
        </div>
      ) : (
        <>
          {tab === 'lista' && <ListView {...ctx} goRegister={() => setTab('registrar')} />}
          {tab === 'acabando' && <ForecastView {...ctx} />}
          {tab === 'registrar' && <PurchaseForm {...ctx} onDone={() => setTab('historico')} />}
          {tab === 'historico' && <HistoryView {...ctx} />}
          {tab === 'precos' && <PricesView {...ctx} />}
          {tab === 'catalogo' && <CatalogView {...ctx} />}
          {tab === 'relatorios' && <ReportsView {...ctx} />}
          {tab === 'api' && <ApiView {...ctx} />}
        </>
      )}
    </section>
  )
}

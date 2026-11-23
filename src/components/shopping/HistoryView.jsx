"use client"

import { useMemo, useState } from 'react'
import { ChevronDown, Trash2, Plus, Save } from 'lucide-react'
import * as shop from '../../lib/shopping'
import { formatCurrency } from '../../utils/format'
import { fmtDate } from './ShoppingModule'
import { useFinance } from '../../context/FinanceContext'

export function HistoryView({ user, groupId, purchases, memberName, reload, panelClass, panelSoftClass, toast }) {
  const { refreshTransactions } = useFinance()
  const [openId, setOpenId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [newItem, setNewItem] = useState({ product: '', quantity: 1, price: '' })

  const monthly = useMemo(() => {
    const totals = new Map()
    for (const purchase of purchases) {
      const key = String(purchase.date).slice(0, 7)
      totals.set(key, (totals.get(key) || 0) + shop.purchaseTotal(purchase))
    }
    return [...totals.entries()]
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
  }, [purchases])
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total))

  async function removePurchase(purchase) {
    try {
      await shop.deletePurchase(groupId, purchase.id)
      if (purchase.transaction_id && refreshTransactions) await refreshTransactions(groupId)
      await reload()
      toast.success('Compra excluída.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível excluir.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  async function saveItemField(item, patch) {
    try {
      await shop.updatePurchaseItem(item.id, patch)
      await reload()
    } catch (err) {
      toast.error(err.message || 'Não foi possível salvar o item.')
    }
  }

  async function addItem(purchase) {
    if (!newItem.product.trim()) return
    try {
      await shop.addPurchaseItem(groupId, user.id, purchase.id, {
        product: newItem.product.trim(),
        quantity: Number(newItem.quantity) || 1,
        unit_price: newItem.price !== '' ? Number(newItem.price) : null,
      })
      setNewItem({ product: '', quantity: 1, price: '' })
      await reload()
      toast.success('Item adicionado.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível adicionar o item.')
    }
  }

  return (
    <div className="space-y-4">
      {monthly.length > 0 && (
        <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelSoftClass}`}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Gasto por mês</h3>
          <div className="flex h-28 items-end gap-2">
            {monthly.map(({ month, total }) => (
              <div key={month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-300">{formatCurrency(total)}</span>
                <div
                  className="w-full rounded-t-lg bg-cyan-400/70"
                  style={{ height: `${Math.max(6, (total / maxMonthly) * 72)}px` }}
                  title={`${month}: ${formatCurrency(total)}`}
                />
                <span className="text-[10px] text-slate-500">
                  {new Date(`${month}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
          Últimas compras ({purchases.length})
        </h3>
        {purchases.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Nenhuma compra registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {purchases.map((purchase) => {
              const total = shop.purchaseTotal(purchase)
              const open = openId === purchase.id
              return (
                <li key={purchase.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : purchase.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <ChevronDown size={16} className={`shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {purchase.store?.name || 'Sem loja'} · {formatCurrency(total)}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {fmtDate(purchase.date)} · {(purchase.items || []).length} itens · por {memberName(purchase.created_by)}
                          {purchase.transaction_id ? ' · nas finanças' : ''}
                        </span>
                      </span>
                    </button>
                    {confirmDeleteId === purchase.id ? (
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => removePurchase(purchase)}
                          className="rounded-lg bg-rose-500 px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          Excluir mesmo
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300"
                        >
                          Voltar
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(purchase.id)}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                        aria-label="Excluir compra"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {open && (
                    <div className="mt-3 space-y-2 pl-6">
                      {(purchase.items || []).map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="min-w-[120px] flex-1 truncate">{item.product?.name || 'Produto'}</span>
                          <label className="flex items-center gap-1 text-xs text-slate-500">
                            qtd
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              defaultValue={item.quantity}
                              onBlur={(e) => {
                                const v = Number(e.target.value)
                                if (v && v !== Number(item.quantity)) saveItemField(item, { quantity: v })
                              }}
                              className="w-16 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
                            />
                          </label>
                          <label className="flex items-center gap-1 text-xs text-slate-500">
                            R$/un
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={item.unit_price ?? ''}
                              onBlur={(e) => {
                                const v = e.target.value === '' ? null : Number(e.target.value)
                                if (v !== item.unit_price) saveItemField(item, { unit_price: v, total_price: undefined })
                              }}
                              className="w-20 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
                            />
                          </label>
                          <span className="w-24 text-right font-semibold">{formatCurrency(shop.itemTotal(item))}</span>
                          <button
                            type="button"
                            onClick={async () => { await shop.deletePurchaseItem(item.id); await reload() }}
                            className="rounded-lg p-1 text-slate-600 transition hover:text-rose-300"
                            aria-label="Remover item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <input
                          value={newItem.product}
                          onChange={(e) => setNewItem((c) => ({ ...c, product: e.target.value }))}
                          placeholder="Adicionar produto…"
                          className="min-w-[140px] flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
                        />
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem((c) => ({ ...c, quantity: e.target.value }))}
                          className="w-16 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-sm outline-none focus:border-cyan-400/60"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newItem.price}
                          onChange={(e) => setNewItem((c) => ({ ...c, price: e.target.value }))}
                          placeholder="R$/un"
                          className="w-20 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
                        />
                        <button
                          type="button"
                          onClick={() => addItem(purchase)}
                          className="flex items-center gap-1 rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950"
                        >
                          <Plus size={13} /> <Save size={0} className="hidden" /> Adicionar
                        </button>
                      </div>
                      {purchase.notes && <p className="text-xs text-slate-500">Obs.: {purchase.notes}</p>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

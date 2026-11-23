"use client"

import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Trash2, Sparkles, Eraser } from 'lucide-react'
import * as shop from '../../lib/shopping'
import { formatCurrency } from '../../utils/format'
import { fmtDate } from './ShoppingModule'

export function ListView({ user, groupId, stores, listItems, memberName, reload, panelClass, panelSoftClass, toast, goRegister }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [plan, setPlan] = useState(null)
  const [busy, setBusy] = useState(false)

  const pending = useMemo(() => listItems.filter((i) => !i.done), [listItems])
  const done = useMemo(() => listItems.filter((i) => i.done), [listItems])
  const storeName = (id) => stores.find((s) => s.id === id)?.name || '—'

  useEffect(() => {
    let alive = true
    shop.getShoppingPlan(groupId).then((p) => { if (alive) setPlan(p) }).catch(() => {})
    return () => { alive = false }
  }, [groupId, listItems])

  const planByItem = useMemo(() => {
    const map = new Map()
    for (const entry of plan?.items || []) map.set(entry.item.id, entry)
    return map
  }, [plan])

  async function addItem(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await shop.addListItem(groupId, user, { name: name.trim(), quantity })
      setName('')
      setQuantity(1)
      await reload()
      toast.success('Item adicionado à lista.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível adicionar.')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(item) {
    try {
      await shop.updateListItem(item.id, { done: !item.done })
      await reload()
    } catch (err) {
      toast.error(err.message || 'Não foi possível atualizar o item.')
    }
  }

  async function remove(item) {
    try {
      await shop.deleteListItem(item.id)
      await reload()
    } catch (err) {
      toast.error(err.message || 'Não foi possível remover o item.')
    }
  }

  async function addRunningOut() {
    setBusy(true)
    try {
      const added = await shop.addForecastToList(groupId, user, 7)
      await reload()
      toast.success(added > 0 ? `${added} item(ns) acabando entraram na lista.` : 'Nada novo acabando por aqui.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível trazer os itens.')
    } finally {
      setBusy(false)
    }
  }

  async function clearDone() {
    try {
      await shop.clearShoppingList(groupId, { onlyDone: true })
      await reload()
      toast.success('Itens comprados removidos da lista.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível limpar.')
    }
  }

  return (
    <div className="space-y-4">
      {plan && pending.length > 0 && (
        <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelSoftClass}`}>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Custo estimado</p>
              <p className="text-xl font-bold text-cyan-300">{formatCurrency(plan.estimated_total || 0)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Melhor loja única</p>
              <p className="font-semibold">
                {plan.best_single_store ? `${storeName(plan.best_single_store.store_id)} (${plan.best_single_store.items} itens)` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Próxima compra sugerida</p>
              <p className="font-semibold">{plan.suggested_date ? fmtDate(plan.suggested_date) : '—'}</p>
            </div>
          </div>
          {plan.without_price?.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Sem preço conhecido: {plan.without_price.join(', ')}.
            </p>
          )}
        </div>
      )}

      <form onSubmit={addItem} className={`flex flex-wrap items-end gap-2 rounded-[1.75rem] border p-4 ${panelClass}`}>
        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Adicionar item</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Arroz, Leite, Sabão em pó…"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
          />
        </label>
        <label className="w-24">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Qtd</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
        >
          <Plus size={16} /> Adicionar
        </button>
        <button
          type="button"
          onClick={addRunningOut}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300 disabled:opacity-50"
        >
          <Sparkles size={15} /> Trazer o que está acabando
        </button>
      </form>

      <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
          Pendentes ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            Lista vazia. Quando comprar, use a aba Registrar — os itens saem da lista sozinhos.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {pending.map((item) => {
              const entry = planByItem.get(item.id)
              return (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-600 transition hover:border-emerald-400 hover:text-emerald-300"
                    aria-label="Marcar como comprado"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.name} <span className="text-slate-400">× {item.quantity}</span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      por {memberName(item.created_by)}
                      {entry?.best_store_id ? ` · melhor em ${storeName(entry.best_store_id)}` : ''}
                      {entry?.estimated_total != null ? ` · ~${formatCurrency(entry.estimated_total)}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Remover item"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {done.length > 0 && (
          <>
            <div className="mt-5 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Comprados ({done.length})
              </h3>
              <button
                type="button"
                onClick={clearDone}
                className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-rose-300"
              >
                <Eraser size={13} /> Limpar comprados
              </button>
            </div>
            <ul className="divide-y divide-slate-800/60">
              {done.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300"
                    aria-label="Desmarcar"
                  >
                    <Check size={14} />
                  </button>
                  <p className="flex-1 truncate text-sm text-slate-500 line-through">
                    {item.name} <span>× {item.quantity}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Remover item"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          type="button"
          onClick={goRegister}
          className="mt-5 w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
        >
          Registrar a compra feita →
        </button>
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from 'react'
import { Plus, Trash2, ReceiptText } from 'lucide-react'
import * as shop from '../../lib/shopping'
import { formatCurrency } from '../../utils/format'
import { useFinance } from '../../context/FinanceContext'

const emptyItem = () => ({ product: '', quantity: 1, priceMode: 'unit', price: '' })

export function PurchaseForm({ user, profile, groupId, stores, products, reload, panelClass, toast, onDone }) {
  const { refreshTransactions } = useFinance()
  const [store, setStore] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [toFinance, setToFinance] = useState(true)
  const [categoryName, setCategoryName] = useState('Mercado')
  const [removeFromList, setRemoveFromList] = useState(true)
  const [busy, setBusy] = useState(false)

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = Number(item.price) || 0
        return sum + (item.priceMode === 'unit' ? price * (Number(item.quantity) || 0) : price)
      }, 0),
    [items],
  )

  function updateItem(index, patch) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function submit(e) {
    e.preventDefault()
    const validItems = items.filter((i) => i.product.trim())
    if (validItems.length === 0) {
      toast.error('Adicione ao menos um produto.')
      return
    }
    setBusy(true)
    try {
      const { transactionId } = await shop.createPurchase(groupId, user, profile, {
        store: store.trim() || null,
        date,
        notes: notes.trim() || null,
        removeFromList,
        finance: toFinance ? { categoryName: categoryName.trim() || 'Mercado' } : null,
        items: validItems.map((i) => ({
          product: i.product.trim(),
          quantity: Number(i.quantity) || 1,
          unit_price: i.priceMode === 'unit' && i.price !== '' ? Number(i.price) : null,
          total_price: i.priceMode === 'total' && i.price !== '' ? Number(i.price) : null,
        })),
      })
      if (transactionId && refreshTransactions) await refreshTransactions(groupId)
      await reload()
      toast.success('Compra registrada!')
      setStore('')
      setNotes('')
      setItems([emptyItem()])
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Não foi possível registrar a compra.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
      <div className="mb-4 flex items-center gap-2">
        <ReceiptText size={17} className="text-cyan-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Registrar compra</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Loja</span>
          <input
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="Ex.: Assaí, Carrefour, Farmácia…"
            list="shop-stores"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
          />
          <datalist id="shop-stores">
            {stores.map((s) => <option key={s.id} value={s.name} />)}
          </datalist>
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60"
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
            <label className="min-w-[160px] flex-1">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Produto</span>
              <input
                value={item.product}
                onChange={(e) => updateItem(index, { product: e.target.value })}
                placeholder="Nome do produto"
                list="shop-products"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
              />
            </label>
            <label className="w-20">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Qtd</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
              />
            </label>
            <label className="w-32">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {item.priceMode === 'unit' ? 'Preço unit. (R$)' : 'Total (R$)'}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(e) => updateItem(index, { price: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
              />
            </label>
            <button
              type="button"
              onClick={() => updateItem(index, { priceMode: item.priceMode === 'unit' ? 'total' : 'unit' })}
              className="rounded-lg border border-slate-700 px-2.5 py-2 text-[11px] font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
              title="Alternar entre preço unitário e total"
            >
              {item.priceMode === 'unit' ? 'por unidade' : 'total'}
            </button>
            <button
              type="button"
              onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
              disabled={items.length === 1}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-30"
              aria-label="Remover item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <datalist id="shop-products">
          {products.map((p) => <option key={p.id} value={p.name} />)}
        </datalist>
        <button
          type="button"
          onClick={() => setItems((current) => [...current, emptyItem()])}
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
        >
          <Plus size={14} /> Outro produto
        </button>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Observações</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={toFinance} onChange={(e) => setToFinance(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
          Lançar nas finanças
        </label>
        {toFinance && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Categoria
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-32 rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
            />
          </label>
        )}
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={removeFromList} onChange={(e) => setRemoveFromList(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
          Baixar itens da lista
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Total da compra: <span className="text-lg font-bold text-cyan-300">{formatCurrency(total)}</span>
        </p>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
        >
          {busy ? 'Registrando…' : 'Registrar compra'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Lojas e produtos novos são criados na hora. Com "lançar nas finanças", a compra vira uma despesa no
        dashboard do MyDinDin.
      </p>
    </form>
  )
}

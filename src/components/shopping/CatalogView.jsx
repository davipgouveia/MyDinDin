"use client"

import { useState } from 'react'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import * as shop from '../../lib/shopping'

const STORE_KINDS = ['mercado', 'loja', 'farmácia', 'online', 'feira', 'outro']

const inputCls =
  'w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60'
const labelCls = 'mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400'

export function CatalogView({ user, groupId, products, stores, reload, panelClass, toast }) {
  const [newProduct, setNewProduct] = useState('')
  const [newStore, setNewStore] = useState('')
  const [newStoreKind, setNewStoreKind] = useState('mercado')
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingStore, setEditingStore] = useState(null)

  async function addProduct(e) {
    e.preventDefault()
    if (!newProduct.trim()) return
    try {
      await shop.findOrCreateProduct(groupId, user.id, newProduct.trim())
      setNewProduct('')
      await reload()
      toast.success('Produto criado.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível criar o produto.')
    }
  }

  async function addStore(e) {
    e.preventDefault()
    if (!newStore.trim()) return
    try {
      await shop.findOrCreateStore(groupId, user.id, newStore.trim(), newStoreKind)
      setNewStore('')
      await reload()
      toast.success('Loja criada.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível criar a loja.')
    }
  }

  async function saveProduct(e) {
    e.preventDefault()
    try {
      await shop.updateProduct(editingProduct.id, {
        name: editingProduct.name,
        category: editingProduct.category || null,
        unit: editingProduct.unit || 'un',
        brand: editingProduct.brand || null,
        consumable: editingProduct.consumable !== false,
        duration_days_override: editingProduct.duration_days_override === '' || editingProduct.duration_days_override == null
          ? null
          : Number(editingProduct.duration_days_override),
        notes: editingProduct.notes || null,
      })
      setEditingProduct(null)
      await reload()
      toast.success('Produto atualizado.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível salvar.')
    }
  }

  async function saveStore(e) {
    e.preventDefault()
    try {
      await shop.updateStore(editingStore.id, {
        name: editingStore.name,
        kind: editingStore.kind,
        notes: editingStore.notes || null,
      })
      setEditingStore(null)
      await reload()
      toast.success('Loja atualizada.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível salvar.')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Produtos ({products.length})</h3>
        <form onSubmit={addProduct} className="mb-3 flex gap-2">
          <input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Novo produto…" className={inputCls} />
          <button type="submit" className="flex shrink-0 items-center gap-1 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950">
            <Plus size={15} /> Criar
          </button>
        </form>
        <ul className="max-h-[480px] divide-y divide-slate-800 overflow-y-auto pr-1">
          {products.map((product) => (
            <li key={product.id} className="py-2.5">
              {editingProduct?.id === product.id ? (
                <form onSubmit={saveProduct} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="col-span-2"><span className={labelCls}>Nome</span>
                      <input value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className={inputCls} /></label>
                    <label><span className={labelCls}>Categoria</span>
                      <input value={editingProduct.category || ''} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className={inputCls} /></label>
                    <label><span className={labelCls}>Unidade</span>
                      <input value={editingProduct.unit || 'un'} onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })} className={inputCls} /></label>
                    <label><span className={labelCls}>Marca</span>
                      <input value={editingProduct.brand || ''} onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })} className={inputCls} /></label>
                    <label><span className={labelCls}>Dura quantos dias? (manual)</span>
                      <input type="number" min="0" step="0.5" value={editingProduct.duration_days_override ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, duration_days_override: e.target.value })} placeholder="Automático" className={inputCls} /></label>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingProduct.consumable !== false} onChange={(e) => setEditingProduct({ ...editingProduct, consumable: e.target.checked })} className="h-4 w-4 accent-cyan-400" />
                    É consumível (entra na previsão de término)
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950">Salvar</button>
                    <button type="button" onClick={() => setEditingProduct(null)} className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300">
                      <X size={13} /> Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[product.category, product.brand, product.unit].filter(Boolean).join(' · ') || '—'}
                      {product.consumable === false ? ' · durável' : ''}
                      {product.duration_days_override ? ` · dura ${product.duration_days_override}d` : ''}
                    </p>
                  </div>
                  <button type="button" onClick={() => setEditingProduct({ ...product })} className="rounded-lg p-1.5 text-slate-400 transition hover:text-cyan-300" aria-label="Editar produto">
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => { await shop.deleteProduct(product.id); await reload() }}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Excluir produto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Lojas ({stores.length})</h3>
        <form onSubmit={addStore} className="mb-3 flex gap-2">
          <input value={newStore} onChange={(e) => setNewStore(e.target.value)} placeholder="Nova loja…" className={inputCls} />
          <select value={newStoreKind} onChange={(e) => setNewStoreKind(e.target.value)} className="shrink-0 rounded-xl border border-slate-700 bg-slate-900/60 px-2 py-2 text-sm outline-none">
            {STORE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button type="submit" className="flex shrink-0 items-center gap-1 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950">
            <Plus size={15} /> Criar
          </button>
        </form>
        <ul className="max-h-[480px] divide-y divide-slate-800 overflow-y-auto pr-1">
          {stores.map((store) => (
            <li key={store.id} className="py-2.5">
              {editingStore?.id === store.id ? (
                <form onSubmit={saveStore} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label><span className={labelCls}>Nome</span>
                      <input value={editingStore.name} onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })} className={inputCls} /></label>
                    <label><span className={labelCls}>Tipo</span>
                      <select value={editingStore.kind} onChange={(e) => setEditingStore({ ...editingStore, kind: e.target.value })} className={inputCls}>
                        {STORE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select></label>
                    <label className="col-span-2"><span className={labelCls}>Observações</span>
                      <input value={editingStore.notes || ''} onChange={(e) => setEditingStore({ ...editingStore, notes: e.target.value })} className={inputCls} /></label>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950">Salvar</button>
                    <button type="button" onClick={() => setEditingStore(null)} className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300">
                      <X size={13} /> Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{store.name}</p>
                    <p className="truncate text-xs text-slate-500">{store.kind}{store.notes ? ` · ${store.notes}` : ''}</p>
                  </div>
                  <button type="button" onClick={() => setEditingStore({ ...store })} className="rounded-lg p-1.5 text-slate-400 transition hover:text-cyan-300" aria-label="Editar loja">
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => { await shop.deleteStore(store.id); await reload() }}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Excluir loja"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

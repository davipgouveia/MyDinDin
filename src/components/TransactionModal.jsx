import { useState } from 'react'
import { X } from 'lucide-react'

const defaultForm = {
  description: '',
  amount: '',
  type: 'expense',
  category: 'Outros',
}

export default function TransactionModal({ open, onClose, onSave, submitting = false }) {
  const [form, setForm] = useState(defaultForm)

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.description || !form.amount || Number(form.amount) <= 0) return

    Promise.resolve(onSave(form))
      .then(() => {
        setForm(defaultForm)
        onClose()
      })
      .catch(() => {
        // O erro ja e exibido pelo contexto.
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/65 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nova transacao</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </header>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            required
            type="text"
            placeholder="Descricao"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
          />

          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Valor"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
          />

          <div className="grid grid-cols-1 gap-3">
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            >
              <option value="income">Entrada</option>
              <option value="expense">Saida</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Categoria"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Salvando...' : 'Salvar transacao'}
          </button>
        </form>
      </div>
    </div>
  )
}

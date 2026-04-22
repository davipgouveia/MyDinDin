import { useState } from 'react'
import { useTransactionCategory } from '../context/TransactionCategoryContext'
import { X } from 'lucide-react'
import { HelpHint } from './HelpHint'

const defaultForm = {
  description: '',
  amount: '',
  type: 'expense',
  category: 'Outros',
  dueDate: '',
  isPaid: true,
}

export default function TransactionModal({ open, onClose, onSave, submitting = false }) {
  const [form, setForm] = useState(defaultForm)
  const isIncome = form.type === 'income'
  const { getAllCategories } = useTransactionCategory()
  const categories = getAllCategories(form.type)

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
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">Descrição</label>
              <HelpHint text="Nome curto para identificar esta transação no histórico." />
            </div>
            <input
              required
              type="text"
              placeholder="Descricao"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">Valor</label>
              <HelpHint text="Informe o valor em reais. Use ponto para centavos, ex: 24.90." />
            </div>
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
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">Tipo</label>
              <HelpHint text="Escolha se esta transação será uma entrada ou uma despesa." />
            </div>
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            >
              <option value="income">Entrada</option>
              <option value="expense">Saida</option>
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">Categoria</label>
              <HelpHint text="Use a categoria para organizar relatórios e metas de orçamento." />
            </div>
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id || cat} value={cat.name || cat}>
                  {cat.name || cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">{isIncome ? 'Data prevista' : 'Vencimento'}</label>
              <HelpHint text={isIncome ? 'Informe quando você espera receber este valor. Pode ficar em branco.' : 'Use este campo para lembrar quando a conta vence. Pode ficar em branco.'} />
            </div>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-300">{isIncome ? 'Recebimento concluído' : 'Pagamento concluído'}</label>
            <HelpHint text={isIncome ? 'Marque quando essa receita já tiver sido recebida.' : 'Marque quando a transação já estiver paga.'} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isPaid}
              onChange={(event) => setForm((prev) => ({ ...prev, isPaid: event.target.checked }))}
            />
            {isIncome ? 'Já foi recebido' : 'Já foi pago'}
          </label>

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

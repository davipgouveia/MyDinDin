import { useState } from 'react'
import { Repeat } from 'lucide-react'
import { toast } from '../hooks/useToast'

const todayISO = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function RecurringPaymentForm({ categories = [], onCreate, panelClass = '' }) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    type: 'expense',
    category: 'Contas & Serviços',
    frequency: 'mensal',
    nextDueDate: todayISO(),
    autoPost: true,
  })

  const handleSubmit = (event) => {
    event.preventDefault()

    const amount = Number(String(form.amount).replace(',', '.'))
    if (!form.name.trim()) {
      toast.error('Dê um nome para a conta fixa (ex.: Aluguel, Internet, Salário).')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Informe um valor maior que zero.')
      return
    }

    onCreate({
      name: form.name.trim(),
      amount,
      type: form.type,
      category: form.category,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate,
      startDate: form.nextDueDate,
      autoPost: form.autoPost,
    })

    setForm((prev) => ({ ...prev, name: '', amount: '' }))
  }

  const inputClass = 'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none'
  const labelClass = 'mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-400'

  return (
    <section className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-full bg-purple-400/10 p-1.5 text-purple-300">
          <Repeat size={14} />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Nova conta fixa</h3>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        Aluguel, internet, streaming, salário... Cadastre uma vez e, se deixar o lançamento automático ligado, ela se lança sozinha todo mês. Sem precisar lembrar.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nome</label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Ex.: Internet, Aluguel, Netflix"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Valor (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="Ex.: 119,90"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: 'expense', category: prev.type === 'expense' ? prev.category : 'Contas & Serviços' }))}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${form.type === 'expense' ? 'border-red-400/40 bg-red-400/10 text-red-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, type: 'income', category: prev.type === 'income' ? prev.category : 'Salário' }))}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${form.type === 'income' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
            >
              Receita
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Categoria</label>
          <select
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className={inputClass}
          >
            {[...new Set(['Contas & Serviços', 'Salário', ...categories])].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Repete</label>
          <select
            value={form.frequency}
            onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value }))}
            className={inputClass}
          >
            <option value="mensal">Todo mês</option>
            <option value="semanal">Toda semana</option>
            <option value="quinzenal">A cada 15 dias</option>
            <option value="trimestral">A cada 3 meses</option>
            <option value="semestral">A cada 6 meses</option>
            <option value="anual">Todo ano</option>
            <option value="diaria">Todo dia</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Próximo vencimento</label>
          <input
            type="date"
            value={form.nextDueDate}
            onChange={(event) => setForm((prev) => ({ ...prev, nextDueDate: event.target.value }))}
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.autoPost}
            onChange={(event) => setForm((prev) => ({ ...prev, autoPost: event.target.checked }))}
            className="h-4 w-4 accent-emerald-500"
          />
          Lançar sozinho no vencimento (você só confere depois)
        </label>

        <button
          type="submit"
          className="rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 sm:col-span-2"
        >
          Salvar conta fixa
        </button>
      </form>
    </section>
  )
}

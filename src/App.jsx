import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { LoaderCircle, LogOut, Plus, ServerCrash } from 'lucide-react'
import SummaryCard from './components/SummaryCard'
import TransactionItem from './components/TransactionItem'
import TransactionModal from './components/TransactionModal'
import { useFinance } from './context/FinanceContext'

const palette = ['#06b6d4', '#22c55e', '#f97316', '#eab308', '#ef4444', '#8b5cf6']

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState('signin')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [setupForm, setSetupForm] = useState({ groupName: '', fullName: '' })

  const {
    isSupabaseConfigured,
    loading,
    submitting,
    error,
    setError,
    user,
    profile,
    visibleTransactions,
    summary,
    categoryChart,
    users,
    ownerFilter,
    setOwnerFilter,
    signIn,
    signUp,
    signOut,
    bootstrapFamilyGroup,
    addTransaction,
    deleteTransaction,
  } = useFinance()

  const latestTransactions = useMemo(
    () => visibleTransactions.slice(0, 10),
    [visibleTransactions],
  )

  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    try {
      if (mode === 'signin') {
        await signIn(authForm)
      } else {
        await signUp(authForm)
      }

      setAuthForm({ email: '', password: '' })
    } catch (authError) {
      setError(authError.message)
    }
  }

  const handleSetupSubmit = async (event) => {
    event.preventDefault()

    try {
      await bootstrapFamilyGroup(setupForm)
      setSetupForm({ groupName: '', fullName: '' })
    } catch (setupError) {
      setError(setupError.message)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (signOutError) {
      setError(signOutError.message)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg items-center p-4">
        <section className="w-full rounded-3xl border border-amber-400/20 bg-slate-900/80 p-6">
          <div className="mb-4 flex items-center gap-2 text-amber-300">
            <ServerCrash size={18} />
            <h1 className="text-lg font-semibold">Supabase não configurado</h1>
          </div>
          <p className="text-sm text-slate-300">
            Crie um arquivo <strong>.env</strong> na raiz com as variáveis <strong>VITE_SUPABASE_URL</strong>
            {' '}e <strong>VITE_SUPABASE_ANON_KEY</strong>, depois reinicie o <strong>npm run dev</strong>.
          </p>
        </section>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center p-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
          <LoaderCircle className="animate-spin text-cyan-400" size={18} />
          <span className="text-sm text-slate-300">Conectando com Supabase...</span>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <h1 className="text-2xl font-bold">FinanceiroD&L</h1>
          <p className="mt-1 text-sm text-slate-400">Entrar para acessar os dados do grupo familiar</p>

          <form className="mt-5 space-y-3" onSubmit={handleAuthSubmit}>
            <input
              required
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />
            <input
              required
              type="password"
              placeholder="Senha"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
              setError(null)
            }}
            className="mt-3 text-sm text-cyan-300 underline-offset-2 hover:underline"
          >
            {mode === 'signin' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>

          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <h1 className="text-2xl font-bold">Criar grupo familiar</h1>
          <p className="mt-1 text-sm text-slate-400">Primeiro acesso: configure o seu espaço multi-tenant.</p>

          <form className="mt-5 space-y-3" onSubmit={handleSetupSubmit}>
            <input
              required
              type="text"
              placeholder="Nome do grupo (ex: Casa D&L)"
              value={setupForm.groupName}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, groupName: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />
            <input
              required
              type="text"
              placeholder="Seu nome completo"
              value={setupForm.fullName}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Criando...' : 'Criar grupo'}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4 pb-24">
      <header className="mt-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">FinanceiroD&L</h1>
            <p className="text-sm text-slate-400">Conectado ao Supabase com RLS por grupo</p>
            <p className="mt-1 inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
              build online v2
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {error ? (
        <section className="rounded-xl border border-rose-700/40 bg-rose-900/20 px-3 py-2 text-xs text-rose-200">
          {error}
        </section>
      ) : null}

      <section className="grid gap-3">
        <SummaryCard
          title="Saldo total"
          value={summary.balance}
          subtitle="Atualizado em tempo real"
          highlight
        />

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard title="Total receitas" value={summary.income} />
          <SummaryCard title="Total despesas" value={summary.expense} />
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Categorias</h2>
          <select
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs"
          >
            {users.map((user) => (
              <option key={user} value={user}>
                {user === 'Todos' ? 'Total do casal' : user}
              </option>
            ))}
          </select>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryChart}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
              >
                {categoryChart.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '0.75rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/70 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
          Ultimas 10 transacoes
        </h2>

        <ul className="space-y-2">
          {latestTransactions.length > 0 ? (
            latestTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} onDelete={deleteTransaction} />
            ))
          ) : (
            <li className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
              Nenhuma transacao para o filtro selecionado.
            </li>
          )}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-cyan-500 p-4 text-slate-950 shadow-glow transition hover:bg-cyan-400"
        aria-label="Adicionar transacao"
      >
        <Plus size={24} />
      </button>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTransaction}
        submitting={submitting}
      />
    </main>
  )
}

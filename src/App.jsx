import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { LoaderCircle, LogOut, Plus, ServerCrash, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import SummaryCard from './components/SummaryCard'
import TransactionItem from './components/TransactionItem'
import TransactionModal from './components/TransactionModal'
import { LoginScreen } from './components/LoginScreen'
import Logo from './components/Logo'
import { DailyStatsCard, MonthlyStatsCard } from './components/StatsCards'
import { PaymentRemindersSection, RecurringPaymentsSection } from './components/RemindersSection'
import { CategoriesManager } from './components/CategoriesManager'
import { AIRecommendationsPanel, BudgetAlertPanel } from './components/AIRecommendations'
import { AdvancedTransactionModal } from './components/AdvancedTransactionModal'
import { useFinance } from './context/FinanceContext'
import { TransactionCategoryProvider, useTransactionCategory } from './context/TransactionCategoryContext'
import { useFinancialAI, useFinancialBudget } from './hooks/useFinancialAI'
import { ToastProvider, toast } from './hooks/useToast'

const palette = ['#06b6d4', '#22c55e', '#f97316', '#eab308', '#ef4444', '#8b5cf6']

// ComponenteWrapper com acesso aos novos contextos
function DashboardContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showSettings, setShowSettings] = useState(false)

  // Novos contextos
  const {
    paymentReminders,
    removePaymentReminder,
    updatePaymentReminder,
    recurringPayments,
    removeRecurringPayment,
    addCustomCategory,
    getOrderedCategories,
  } = useTransactionCategory()

  const { recommendations, dismissRecommendation } = useFinancialAI()
  const { getBudgetStatus } = useFinancialBudget()

  // Contexto original
  const {
    loading,
    submitting,
    error,
    setError,
    profile,
    visibleTransactions,
    summary,
    categoryChart,
    users,
    ownerFilter,
    setOwnerFilter,
    signOut,
    addTransaction,
    deleteTransaction,
  } = useFinance()

  const latestTransactions = useMemo(
    () => visibleTransactions.slice(0, 10),
    [visibleTransactions],
  )

  const upcomingReminders = useMemo(
    () => paymentReminders.filter((r) => !r.completed).slice(0, 3),
    [paymentReminders],
  )

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (signOutError) {
      setError(signOutError.message)
    }
  }

  const handleAddTransaction = (formData) => {
    try {
      addTransaction({
        description: formData.description,
        amount: formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount),
        category: formData.category,
        created_at: formData.date || new Date().toISOString(),
        dueDate: formData.dueDate || null,
        isPaid: formData.isPaid ?? true,
      })
      toast.success('Transação adicionada com sucesso!')
      setAdvancedModalOpen(false)
    } catch (err) {
      toast.error(`Erro: ${err.message}`)
    }
  }

  const handleRemoveReminder = (reminderId) => {
    removePaymentReminder(reminderId)
    toast.success('Lembrete removido!')
  }

  const handleCompleteReminder = (reminderId) => {
    updatePaymentReminder(reminderId, { completed: true })
    toast.success('Lembrete marcado como concluído!')
  }

  const handleRemoveRecurring = (paymentId) => {
    removeRecurringPayment(paymentId)
    toast.success('Pagamento recorrente removido!')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 p-4 pb-24">
      {/* HEADER */}
      <header className="mt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <Logo size="small" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">FinançasAPP</h1>
              <p className="text-sm text-slate-400">Gestão financeira para grupos e famílias</p>
              <p className="mt-1 inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
                v2.0 enterprise
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-slate-300 transition hover:border-slate-500 hover:text-white"
            aria-label="Configurações"
            title="Configurações"
          >
            <Settings size={16} />
          </button>
        </div>
        {showSettings && (
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={handleSignOut}
            className="mt-2 rounded-lg border border-red-700/30 bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-900/40"
          >
            Sair da conta
          </motion.button>
        )}
      </header>

      {/* MENSAGENS DE ERRO */}
      {error && (
        <section className="rounded-xl border border-rose-700/40 bg-rose-900/20 px-3 py-2 text-xs text-rose-200">
          {error}
        </section>
      )}

      {/* ABAS DE NAVEGAÇÃO */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 flex gap-2 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/50 p-1.5 backdrop-blur"
      >
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'stats', label: '📈 Estatísticas' },
          { id: 'categories', label: '🎯 Categorias' },
          { id: 'reminders', label: '🔔 Lembretes' },
          { id: 'ai', label: '🤖 IA' },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/30'
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {/* TAB 1: DASHBOARD - Padrão */}
      {activeTab === 'dashboard' && (
        <>
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
              Últimas transações
            </h2>

            <ul className="space-y-2">
              {latestTransactions.length > 0 ? (
                latestTransactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} onDelete={deleteTransaction} />
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
                  Nenhuma transação para o filtro selecionado.
                </li>
              )}
            </ul>
          </section>
        </>
      )}

      {/* TAB 2: ESTATÍSTICAS */}
      {activeTab === 'stats' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <DailyStatsCard />
            <MonthlyStatsCard />
          </div>
          {upcomingReminders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <PaymentRemindersSection
                reminders={upcomingReminders}
                onDelete={handleRemoveReminder}
                onComplete={handleCompleteReminder}
              />
            </motion.div>
          )}
          {upcomingReminders.length === 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center text-sm text-slate-400">
              Nenhum lembrete próximo. Tudo em dia! ✨
            </div>
          )}
        </section>
      )}

      {/* TAB 3: CATEGORIAS */}
      {activeTab === 'categories' && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4"
        >
          <CategoriesManager
            categories={getOrderedCategories('expense')}
            onAddCustom={(category) => {
              addCustomCategory(category)
            }}
          />
        </motion.section>
      )}

      {/* TAB 4: LEMBRETES */}
      {activeTab === 'reminders' && (
        <section className="space-y-4">
          {paymentReminders.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PaymentRemindersSection
                reminders={paymentReminders}
                onDelete={handleRemoveReminder}
                onComplete={handleCompleteReminder}
              />
            </motion.div>
          ) : null}

          {recurringPayments.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <RecurringPaymentsSection payments={recurringPayments} onDelete={handleRemoveRecurring} />
            </motion.div>
          ) : null}

          {paymentReminders.length === 0 && recurringPayments.length === 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
              <p className="text-sm text-slate-400">Nenhum lembrete ou pagamento recorrente configurado</p>
            </div>
          )}
        </section>
      )}

      {/* TAB 5: INTELIGÊNCIA ARTIFICIAL */}
      {activeTab === 'ai' && (
        <section className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AIRecommendationsPanel
              recommendations={recommendations}
              onDismiss={dismissRecommendation}
            />
          </motion.div>

          {getBudgetStatus && getBudgetStatus.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BudgetAlertPanel budgets={getBudgetStatus} />
            </motion.div>
          )}
        </section>
      )}

      {/* BOTÕES FLUTUANTES */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-cyan-500 p-4 text-slate-950 shadow-glow transition hover:bg-cyan-400"
        aria-label="Adicionar transação rápida"
      >
        <Plus size={24} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={() => setAdvancedModalOpen(true)}
        className="fixed bottom-24 right-6 rounded-full bg-blue-600 p-4 text-white shadow-glow transition hover:bg-blue-500"
        aria-label="Adicionar transação avançada"
        title="Modo avançado com mais opções"
      >
        <Plus size={24} />
      </motion.button>

      {/* MODAIS */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTransaction}
        submitting={submitting}
      />

      <AdvancedTransactionModal
        isOpen={advancedModalOpen}
        onClose={() => setAdvancedModalOpen(false)}
        onSubmit={handleAddTransaction}
      />
    </main>
  )
}

// App component com providers
export default function App() {
  const { isSupabaseConfigured, loading, user, profile } = useFinance()

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
    return <SignInView />
  }

  if (!profile) {
    return <SetupView />
  }

  // Dashboard com novos providers
  return (
    <>
      <ToastProvider />
      <TransactionCategoryProvider>
        <DashboardContent />
      </TransactionCategoryProvider>
    </>
  )
}

// ============= COMPONENTES DE AUTENTICAÇÃO =============

function SignInView() {
  const [mode, setMode] = useState('signin')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const { submitting, error, setError, signIn, signUp } = useFinance()

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

  return (
    <LoginScreen>
      <section className="w-full rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold">FinançasAPP</h1>
        <p className="mt-1 text-sm text-slate-400">Entrar para acessar sua área financeira</p>

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

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>
    </LoginScreen>
  )
}

function SetupView() {
  const [setupForm, setSetupForm] = useState({ groupName: '', fullName: '' })
  const { submitting, error, setError, bootstrapFamilyGroup } = useFinance()

  const handleSetupSubmit = async (event) => {
    event.preventDefault()

    try {
      await bootstrapFamilyGroup(setupForm)
      setSetupForm({ groupName: '', fullName: '' })
    } catch (setupError) {
      setError(setupError.message)
    }
  }

  return (
    <LoginScreen>
      <section className="w-full rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold">Criar espaço financeiro</h1>
        <p className="mt-1 text-sm text-slate-400">Primeiro acesso: configure seu espaço multiusuário.</p>

        <form className="mt-5 space-y-3" onSubmit={handleSetupSubmit}>
          <input
            required
            type="text"
            placeholder="Nome do grupo (ex: Casa Família)"
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

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>
    </LoginScreen>
  )
}

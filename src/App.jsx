"use client"

import { useCallback, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus, ServerCrash, Settings } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import SummaryCard from './components/SummaryCard'
import TransactionItem from './components/TransactionItem'
import { LoginScreen } from './components/LoginScreen'
import Logo from './components/Logo'
import { AdvancedStatsCharts, DailyStatsCard, MonthlyStatsCard } from './components/StatsCards'
import { PaymentRemindersSection, RecurringPaymentsSection } from './components/RemindersSection'
import { CategoriesManager } from './components/CategoriesManager'
import { AIRecommendationsPanel, BudgetAlertPanel } from './components/AIRecommendations'
import { FinanceChatPanel } from './components/FinanceChatPanel'
import { ChatProvider } from './context/ChatContext'
import { AdvancedTransactionModal } from './components/AdvancedTransactionModal'
import { MobileBottomNav } from './components/MobileBottomNav'
import { QuickAddSheet } from './components/QuickAddSheet'
import { UserPage } from './components/UserPage'
import { AppFooter } from './components/AppFooter'
import { HelpHint } from './components/HelpHint'
import { LoadingOverlay } from './components/LoadingOverlay'
import { useFinance } from './context/FinanceContext'
import { TransactionCategoryProvider, useTransactionCategory } from './context/TransactionCategoryContext'
import { useFinancialAI, useFinancialBudget } from './hooks/useFinancialAI'
import { ToastProvider, toast } from './hooks/useToast'
import { APP_BUILD_LABEL } from './constants/appMeta'
import { usePreferences } from './context/PreferencesContext'

const palette = ['#06b6d4', '#22c55e', '#f97316', '#eab308', '#ef4444', '#8b5cf6']

function DashboardContent() {
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [showSettings, setShowSettings] = useState(false)
  const [transactionType, setTransactionType] = useState('expense')

  const {
    paymentReminders,
    removePaymentReminder,
    updatePaymentReminder,
    recurringPayments,
    removeRecurringPayment,
    addCustomCategory,
    removeCustomCategory,
    getOrderedCategories,
    saveCategoryOrder,
  } = useTransactionCategory()

  const { recommendations, insights, dismissRecommendation } = useFinancialAI()
  const { budgets, addBudget, removeBudget, getBudgetStatus } = useFinancialBudget()

  const {
    error,
    setError,
    profile,
    user,
    visibleTransactions,
    transactionComments,
    activityLogs,
    summary,
    categoryChart,
    users,
    ownerFilter,
    setOwnerFilter,
    signOut,
    addTransaction,
    deleteTransaction,
    addTransactionComment,
  } = useFinance()
  const { theme, layoutMode, t, toggleTheme } = usePreferences()
  const isLight = theme === 'light'
  const shellWidthStyle = useMemo(
    () => ({
      maxWidth:
        layoutMode === 'focus'
          ? '64rem'
          : layoutMode === 'expanded'
            ? '90rem'
            : '80rem',
    }),
    [layoutMode],
  )

  const shellClass = isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-white'
  const headerClass = isLight
    ? 'border-slate-200/90 bg-white/90 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.06)]'
    : 'border-slate-800/80 bg-slate-950/75 text-white shadow-[0_14px_34px_rgba(2,6,23,0.35)]'
  const panelClass = isLight ? 'border-slate-200 bg-white/90 text-slate-900' : 'border-slate-800 bg-slate-950/70 text-white'
  const panelSoftClass = isLight ? 'border-slate-200 bg-white/80 text-slate-900' : 'border-slate-800 bg-slate-900/50 text-white'

  const latestTransactions = useMemo(() => visibleTransactions.slice(0, 10), [visibleTransactions])
  const upcomingReminders = useMemo(
    () => paymentReminders.filter((reminder) => !reminder.completed).slice(0, 3),
    [paymentReminders],
  )

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (signOutError) {
      setError(signOutError.message)
    }
  }, [setError, signOut])

  const handleAddTransaction = useCallback(async (formData) => {
    const resolvedType = formData.type || transactionType || 'expense'

    try {
      await addTransaction({
        type: resolvedType,
        description: formData.description,
        amount: Math.abs(formData.amount),
        category: formData.category,
        created_at: formData.date || new Date().toISOString(),
        date: formData.date || new Date().toISOString().slice(0, 10),
        dueDate: formData.dueDate || null,
        isPaid: formData.isPaid ?? true,
      })
      toast.success('Transação adicionada com sucesso!')
      setAdvancedModalOpen(false)
    } catch (addError) {
      toast.error(`Erro: ${addError.message}`)
    }
  }, [addTransaction, transactionType])

  const handleRemoveReminder = useCallback((reminderId) => {
    removePaymentReminder(reminderId)
    toast.success('Lembrete removido!')
  }, [removePaymentReminder])

  const handleCompleteReminder = useCallback((reminderId) => {
    updatePaymentReminder(reminderId, { completed: true })
    toast.success('Lembrete marcado como concluído!')
  }, [updatePaymentReminder])

  const handleRemoveRecurring = useCallback((paymentId) => {
    removeRecurringPayment(paymentId)
    toast.success('Pagamento recorrente removido!')
  }, [removeRecurringPayment])

  const openQuickAdd = useCallback((type) => {
    setTransactionType(type)
    setQuickAddOpen(false)
    setAdvancedModalOpen(true)
  }, [])

  const toggleSettings = useCallback(() => {
    setShowSettings((current) => !current)
  }, [])

  const pageTabs = useMemo(
    () => [
      { id: 'dashboard', label: t('dashboard') },
      { id: 'stats', label: t('stats') },
      { id: 'categories', label: t('categories') },
      { id: 'reminders', label: t('reminders') },
      { id: 'ai', label: t('ai') },
      { id: 'user', label: t('user') },
    ],
    [t],
  )

  return (
    <main
      className={`mx-auto flex min-h-screen w-full flex-col gap-4 px-3 pb-[9.5rem] pt-3 sm:px-4 md:px-6 md:pb-16 md:pt-6 ${shellClass}`}
      style={shellWidthStyle}
    >
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`rounded-[1.75rem] border p-4 backdrop-blur-xl md:p-5 ${headerClass}`}
      >
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="rounded-[1.4rem] border border-cyan-400/10 bg-cyan-400/[0.07] p-2.5 sm:p-3">
              <Logo size="medium" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                MyDinDin
              </h1>
              <p className={`mt-0.5 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{t('appSubtitle')}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-2.5 py-1 text-cyan-300">
                  {APP_BUILD_LABEL}
                </span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={toggleSettings}
            className="button-secondary shrink-0 self-start rounded-xl border border-slate-700/60 bg-slate-900/55 p-2.5 text-slate-300 transition hover:border-slate-500 sm:self-center"
            aria-label={t('settings')}
            title={t('settings')}
          >
            <Settings size={16} />
          </motion.button>
        </div>

        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-3 flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
              <span>{t('theme')}:</span>
              <span>{theme === 'light' ? t('lightTheme') : t('darkTheme')}</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="button-secondary rounded-xl px-3 py-2 text-xs font-medium text-slate-300"
            >
              {t('themeToggle')}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-red-700/30 bg-red-900/20 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-900/40"
            >
              {t('signOut')}
            </button>
          </motion.div>
        )}
      </motion.header>

      {error && (
        <section className={`rounded-xl border px-3 py-2 text-xs ${isLight ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-rose-700/40 bg-rose-900/20 text-rose-200'}`}>
          {error}
        </section>
      )}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-30 hidden gap-2 overflow-x-auto rounded-2xl border p-1.5 backdrop-blur md:flex ${panelSoftClass}`}
      >
        {pageTabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActivePage(tab.id)}
            className={`relative overflow-hidden whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-all ${
              activePage === tab.id
                ? 'bg-cyan-500/20 text-cyan-300'
                : isLight
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/30'
            }`}
          >
            {activePage === tab.id && (
              <motion.span
                layoutId="tab-active-pill"
                className="absolute inset-0 bg-cyan-500/15"
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="min-h-[30rem]"
        >
      {activePage === 'dashboard' && (
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            <section className="grid gap-3 sm:grid-cols-3">
              <SummaryCard title="Saldo total" value={summary.balance} subtitle="Atualizado em tempo real" highlight />
              <SummaryCard title="Total receitas" value={summary.income} />
              <SummaryCard title="Total despesas" value={summary.expense} />
            </section>

            <section className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Categorias</h2>
                <select
                  value={ownerFilter}
                  onChange={(event) => setOwnerFilter(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                >
                  {users.map((item) => (
                    <option key={item} value={item}>
                      {item === 'Todos' ? t('coupleTotal') : item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-64 w-full md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={90} paddingAngle={2}>
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
          </div>

          <section className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Últimas transações</h2>

            <ul className="space-y-2">
              {latestTransactions.length > 0 ? (
                latestTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onDelete={deleteTransaction}
                    canDelete={profile?.role === 'owner' || transaction.profileId === user?.id}
                    comments={transactionComments[transaction.id] || []}
                    onAddComment={addTransactionComment}
                  />
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
                  Nenhuma transação para o filtro selecionado.
                </li>
              )}
            </ul>
          </section>
        </section>
      )}

      {activePage === 'stats' && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DailyStatsCard />
            <MonthlyStatsCard />
          </div>

          <AdvancedStatsCharts />

          {upcomingReminders.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <PaymentRemindersSection
                reminders={upcomingReminders}
                onDelete={handleRemoveReminder}
                onComplete={handleCompleteReminder}
              />
            </motion.div>
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center text-sm text-slate-400">
              Nenhum lembrete próximo. Tudo em dia! ✨
            </div>
          )}
        </section>
      )}

      {activePage === 'categories' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[1.75rem] border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-4 md:p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Categorias de despesa</h3>
            <CategoriesManager
              categories={getOrderedCategories('expense')}
              onReorder={(order) => saveCategoryOrder(order, 'expense')}
              onAddCustom={(category) => {
                addCustomCategory(category, 'expense')
              }}
              onRemoveCustom={(categoryId) => removeCustomCategory(categoryId, 'expense')}
            />
          </motion.section>

          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[1.75rem] border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-4 md:p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Categorias de receita</h3>
            <CategoriesManager
              categories={getOrderedCategories('income')}
              onReorder={(order) => saveCategoryOrder(order, 'income')}
              onAddCustom={(category) => {
                addCustomCategory(category, 'income')
              }}
              onRemoveCustom={(categoryId) => removeCustomCategory(categoryId, 'income')}
            />
          </motion.section>
        </section>
      )}

      {activePage === 'reminders' && (
        <section className="space-y-4">
          {paymentReminders.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PaymentRemindersSection
                reminders={paymentReminders}
                onDelete={handleRemoveReminder}
                onComplete={handleCompleteReminder}
              />
            </motion.div>
          )}

          {recurringPayments.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <RecurringPaymentsSection payments={recurringPayments} onDelete={handleRemoveRecurring} />
            </motion.div>
          )}

          {paymentReminders.length === 0 && recurringPayments.length === 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-center">
              <p className="text-sm text-slate-400">Nenhum lembrete ou pagamento recorrente configurado</p>
            </div>
          )}
        </section>
      )}

      {activePage === 'ai' && (
        <section className="space-y-4">
          <FinanceChatPanel
            insights={insights}
            recommendations={recommendations}
            budgets={getBudgetStatus || []}
            transactions={visibleTransactions}
          />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AIRecommendationsPanel recommendations={recommendations} insights={insights} onDismiss={dismissRecommendation} />
          </motion.div>

          {getBudgetStatus && getBudgetStatus.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BudgetAlertPanel budgets={getBudgetStatus} />
            </motion.div>
          )}
        </section>
      )}

      {activePage === 'user' && (
        <UserPage
          profile={profile}
          user={user}
          summary={summary}
          transactions={visibleTransactions}
          activityLogs={activityLogs}
          budgets={budgets}
          onCreateBudget={addBudget}
          onDeleteBudget={removeBudget}
          onSignOut={handleSignOut}
          ownerFilter={ownerFilter}
          onOwnerFilterChange={setOwnerFilter}
          users={users}
        />
      )}
        </motion.div>
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        type="button"
        onClick={() => setQuickAddOpen(true)}
        className="button-primary fixed bottom-6 right-6 hidden rounded-full p-4 shadow-glow md:flex"
        aria-label="Escolher tipo de transação"
        title="Escolher despesa ou receita"
      >
        <Plus size={24} />
      </motion.button>

      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSelectType={openQuickAdd} />

      <AdvancedTransactionModal
        isOpen={advancedModalOpen}
        onClose={() => setAdvancedModalOpen(false)}
        onSubmit={handleAddTransaction}
        transactionType={transactionType}
      />

      <AppFooter className="mt-6 pb-2" />
      <MobileBottomNav activePage={activePage} onNavigate={setActivePage} onQuickAdd={() => setQuickAddOpen(true)} />
    </main>
  )
}

export default function App() {
  const { isSupabaseConfigured, loading, user, profile } = useFinance()

  return (
    <>
      <ToastProvider />

      {!isSupabaseConfigured ? (
        <main className="mx-auto flex min-h-screen w-full max-w-lg items-center p-4">
          <section className="w-full rounded-3xl border border-amber-400/20 bg-slate-900/80 p-6">
            <div className="mb-4 flex items-center gap-2 text-amber-300">
              <ServerCrash size={18} />
              <h1 className="text-lg font-semibold">Supabase não configurado</h1>
            </div>
            <p className="text-sm text-slate-300">
              Crie um arquivo <strong>.env</strong> na raiz com as variáveis <strong>VITE_SUPABASE_URL</strong>
              {' '}e <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong>, depois reinicie o <strong>npm run dev</strong>.
            </p>
          </section>
        </main>
      ) : loading ? (
        <LoadingOverlay />
      ) : !user ? (
        <SignInView />
      ) : !profile ? (
        <SetupView />
      ) : (
        <TransactionCategoryProvider>
          <ChatProvider>
            <DashboardContent />
          </ChatProvider>
        </TransactionCategoryProvider>
      )}
    </>
  )
}

function SignInView() {
  const [mode, setMode] = useState('signin')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const { submitting, error, setError, signIn, signUp, resetPassword } = useFinance()
  const { t } = usePreferences()

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

  const handlePasswordReset = async () => {
    if (!authForm.email) {
      setError('Informe seu email para redefinir a senha.')
      return
    }

    try {
      await resetPassword(authForm.email)
      toast.success('Enviamos um link para redefinir sua senha.')
    } catch (resetError) {
      setError(resetError.message)
    }
  }

  const isSignUp = mode === 'signup'

  return (
    <LoginScreen variant={isSignUp ? 'signup' : 'signin'}>
      <section
        className={`w-full rounded-3xl border p-6 shadow-2xl backdrop-blur-xl ${
          isSignUp
            ? 'border-emerald-300/20 bg-emerald-950/35'
            : 'border-white/10 bg-slate-950/60'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{isSignUp ? t('signUpTitle') : t('signInTitle')}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {isSignUp ? t('signUpSubtitle') : t('signInSubtitle')}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              isSignUp
                ? 'border border-emerald-300/30 bg-emerald-400/15 text-emerald-100'
                : 'border border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
            }`}
          >
            {isSignUp ? 'Cadastro' : 'Login'}
          </span>
        </div>

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
            className={`w-full rounded-lg py-2.5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isSignUp ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-cyan-500 hover:bg-cyan-400'
            }`}
          >
            {submitting ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
              setError(null)
            }}
            className="text-sm text-cyan-300 underline-offset-2 hover:underline"
          >
            {mode === 'signin' ? t('signInAction') : t('signUpAction')}
          </button>

          {mode === 'signin' && (
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-sm text-slate-300 underline-offset-2 transition hover:text-cyan-300 hover:underline"
            >
              {t('forgotPassword')}
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>
    </LoginScreen>
  )
}

function SetupView() {
  const [setupForm, setSetupForm] = useState({ groupName: '', fullName: '' })
  const { submitting, error, setError, bootstrapFamilyGroup } = useFinance()
  const { t } = usePreferences()

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
        <h1 className="text-2xl font-bold">{t('setupGroupTitle')}</h1>
        <p className="mt-1 text-sm text-slate-400">{t('setupGroupSubtitle')}</p>

        <form className="mt-5 space-y-3" onSubmit={handleSetupSubmit}>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">{t('groupNameLabel')}</label>
              <HelpHint text={t('groupNameHint')} />
            </div>
            <input
              required
              type="text"
              placeholder={t('groupNameLabel')}
              value={setupForm.groupName}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, groupName: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">{t('fullNameLabel')}</label>
              <HelpHint text={t('fullNameHint')} />
            </div>
            <input
              required
              type="text"
              placeholder={t('fullNameLabel')}
              value={setupForm.fullName}
              onChange={(event) => setSetupForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t('configuringGroup') : t('createGroup')}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>
    </LoginScreen>
  )
}
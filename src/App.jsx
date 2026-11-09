"use client"

import { useCallback, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CheckCircle2, Plus, ServerCrash, Settings, X } from 'lucide-react'
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
import { QuickCapture } from './components/QuickCapture'
import { PendingClassification } from './components/PendingClassification'
import { StatementImport } from './components/StatementImport'
import { WeeklySummary } from './components/WeeklySummary'
import { FirstStep } from './components/FirstStep'
import { ConfirmDialog } from './components/ConfirmDialog'
import { RecurringPaymentForm } from './components/RecurringPaymentForm'
import { buildLearnedCategoryMap, UNCATEGORIZED_LABEL } from './lib/quickParse'
import { useRecurringAutoPost, advanceRecurringDate } from './hooks/useRecurringAutoPost'
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
  const [pendingDeleteTx, setPendingDeleteTx] = useState(null)
  const [deletingTx, setDeletingTx] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const [editingRecurring, setEditingRecurring] = useState(null)

  const {
    paymentReminders,
    removePaymentReminder,
    updatePaymentReminder,
    recurringPayments,
    addRecurringPayment,
    updateRecurringPayment,
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
    group,
    members,
    groupInvites,
    pendingGroupInvites,
    updateGroupSettings,
    inviteGroupMember,
    revokeGroupInvite,
    acceptGroupInvite,
    leaveGroup,
    removeGroupMember,
    transactions,
    addTransactionsBatch,
    updateTransactionCategory,
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

  const learnedCategoryMap = useMemo(() => buildLearnedCategoryMap(transactions), [transactions])
  const allCategoryNames = useMemo(() => {
    const names = new Set()
    getOrderedCategories('expense').forEach((category) => names.add(category.name))
    getOrderedCategories('income').forEach((category) => names.add(category.name))
    transactions.forEach((tx) => {
      if (tx.category) names.add(tx.category)
    })
    return [...names]
  }, [getOrderedCategories, transactions])
  const pendingClassification = useMemo(
    () => transactions.filter((tx) => tx.category === UNCATEGORIZED_LABEL),
    [transactions],
  )

  const handleQuickSubmit = useCallback(async ({ amount, type, description, category, dateISO }) => {
    await addTransaction({
      type,
      description,
      amount: Math.abs(amount),
      category,
      date: dateISO,
      created_at: dateISO,
      dueDate: null,
      isPaid: true,
      source: 'quick',
    })
  }, [addTransaction])

  useRecurringAutoPost({
    enabled: Boolean(profile?.group_id),
    recurringPayments,
    transactions,
    addTransaction,
    updateRecurringPayment,
  })

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
        paymentMethod: formData.paymentMethod || null,
        notes: formData.notes?.trim() ? formData.notes.trim() : null,
      })

      // "Pagamento recorrente" marcado no formulario cria a conta fixa de
      // verdade — antes esses campos eram coletados e descartados em
      // silencio, e a pessoa achava que a conta ia se repetir.
      if (formData.isRecurring && formData.frequency && formData.frequency !== 'unica') {
        const baseDate = formData.date || new Date().toISOString().slice(0, 10)
        const categoryName = getOrderedCategories(resolvedType)
          .find((category) => category.id === formData.category)?.name || formData.category

        addRecurringPayment({
          name: formData.description,
          amount: Math.abs(formData.amount),
          type: resolvedType,
          category: categoryName,
          frequency: formData.frequency,
          startDate: baseDate,
          nextDueDate: advanceRecurringDate(baseDate, formData.frequency),
          endDate: formData.endDate || null,
          autoPost: true,
        })
        toast.success('Conta fixa criada: ela lança sozinha no vencimento. Dá pra desligar em Lembretes.')
      }

      toast.success('Transação adicionada com sucesso!')
      setAdvancedModalOpen(false)
    } catch (addError) {
      toast.error(`Erro: ${addError.message}`)
    }
  }, [addRecurringPayment, addTransaction, getOrderedCategories, transactionType])

  const handleConfirmDeleteTx = useCallback(async () => {
    if (!pendingDeleteTx) return

    setDeletingTx(true)
    try {
      await deleteTransaction(pendingDeleteTx.id)
      toast.success('Lançamento excluído.')
      setPendingDeleteTx(null)
    } catch (deleteError) {
      toast.error(`Não consegui excluir: ${deleteError.message}`)
    } finally {
      setDeletingTx(false)
    }
  }, [deleteTransaction, pendingDeleteTx])

  const handleConfirmRemoval = useCallback(() => {
    if (!pendingRemoval) return

    if (pendingRemoval.kind === 'reminder') {
      removePaymentReminder(pendingRemoval.id)
      toast.success('Lembrete removido!')
    } else {
      removeRecurringPayment(pendingRemoval.id)
    }
    setPendingRemoval(null)
  }, [pendingRemoval, removePaymentReminder, removeRecurringPayment])

  const handleRecommendationAction = useCallback((rec) => {
    if (rec.id === 'good_savings') {
      dismissRecommendation(rec.id)
      toast.success('Continue assim! 🎉')
      return
    }

    if (['high_category', 'spending_spike', 'monthly_forecast_growth'].includes(rec.id)) {
      setActivePage('stats')
      toast.info('Te levei pras Estatísticas pra analisar isso com calma.')
      return
    }

    setActivePage('user')
    toast.info('Os orçamentos compartilhados ficam na aba Usuário.')
  }, [dismissRecommendation])

  const handleRemoveReminder = useCallback((reminderId) => {
    const reminder = paymentReminders.find((item) => item.id === reminderId)
    setPendingRemoval({ kind: 'reminder', id: reminderId, label: reminder?.description || 'este lembrete' })
  }, [paymentReminders])

  const handleCompleteReminder = useCallback((reminderId) => {
    updatePaymentReminder(reminderId, { completed: true })
    toast.success('Lembrete marcado como concluído!')
  }, [updatePaymentReminder])

  const handleRemoveRecurring = useCallback((paymentId) => {
    const payment = recurringPayments.find((item) => item.id === paymentId)
    setPendingRemoval({ kind: 'recurring', id: paymentId, label: payment?.name || 'este pagamento recorrente' })
  }, [recurringPayments])

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
        <section className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${isLight ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-rose-700/40 bg-rose-900/20 text-rose-200'}`}>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Fechar aviso"
            className="shrink-0 rounded-full p-1 transition hover:bg-rose-500/10"
          >
            <X size={14} />
          </button>
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
        transactions.length === 0 ? (
          <FirstStep
            transactions={transactions}
            categories={allCategoryNames}
            learnedMap={learnedCategoryMap}
            onImport={(items) => addTransactionsBatch(items, { source: 'import' })}
            onQuickSubmit={handleQuickSubmit}
            panelClass={panelClass}
            isLight={isLight}
          />
        ) : (
        <section className="grid gap-4">
          <QuickCapture
            categories={allCategoryNames}
            learnedMap={learnedCategoryMap}
            onSubmit={handleQuickSubmit}
            panelClass={panelClass}
          />

          <WeeklySummary transactions={transactions} panelClass={panelClass} />

          <PendingClassification
            transactions={pendingClassification}
            categories={allCategoryNames}
            learnedMap={learnedCategoryMap}
            onClassify={updateTransactionCategory}
            panelClass={panelClass}
          />

          <StatementImport
            transactions={transactions}
            categories={allCategoryNames}
            learnedMap={learnedCategoryMap}
            onImport={(items) => addTransactionsBatch(items, { source: 'import' })}
            panelClass={panelClass}
          />

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
                    onDelete={(id) => setPendingDeleteTx(transactions.find((tx) => tx.id === id) || null)}
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
        </section>
        ))}

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

          <RecurringPaymentForm
            categories={allCategoryNames}
            onCreate={addRecurringPayment}
            editing={editingRecurring}
            onUpdate={(paymentId, payload) => {
              updateRecurringPayment(paymentId, payload)
              toast.success('Conta fixa atualizada!')
              setEditingRecurring(null)
            }}
            onCancelEdit={() => setEditingRecurring(null)}
            panelClass={panelClass}
          />

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RecurringPaymentsSection
              payments={recurringPayments}
              onDelete={handleRemoveRecurring}
              onEdit={(paymentId) => setEditingRecurring(recurringPayments.find((payment) => payment.id === paymentId) || null)}
              onToggleAuto={(payment) => {
                updateRecurringPayment(payment.id, { autoPost: payment.autoPost !== true })
                toast.success(payment.autoPost ? `"${payment.name}" não lança mais sozinho.` : `"${payment.name}" agora lança sozinho no vencimento.`)
              }}
            />
          </motion.div>
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
            <AIRecommendationsPanel recommendations={recommendations} insights={insights} onDismiss={dismissRecommendation} onAction={handleRecommendationAction} />
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
          group={group}
          members={members}
          groupInvites={groupInvites}
          pendingGroupInvites={pendingGroupInvites}
          onUpdateGroupSettings={updateGroupSettings}
          onInviteGroupMember={inviteGroupMember}
          onRevokeGroupInvite={revokeGroupInvite}
          onAcceptGroupInvite={acceptGroupInvite}
          onLeaveGroup={leaveGroup}
          onRemoveGroupMember={removeGroupMember}
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

      <ConfirmDialog
        open={Boolean(pendingDeleteTx)}
        danger
        title="Excluir lançamento?"
        message={pendingDeleteTx
          ? `"${pendingDeleteTx.description}" — ${pendingDeleteTx.type === 'income' ? '+' : '-'}R$ ${Math.abs(Number(pendingDeleteTx.amount) || 0).toFixed(2).replace('.', ',')}\n\nA exclusão é definitiva e some do painel de todo o grupo.`
          : ''}
        confirmLabel="Excluir"
        busy={deletingTx}
        onConfirm={handleConfirmDeleteTx}
        onCancel={() => setPendingDeleteTx(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        danger
        title={pendingRemoval?.kind === 'recurring' ? 'Remover conta fixa?' : 'Remover lembrete?'}
        message={pendingRemoval
          ? `"${pendingRemoval.label}" será removido${pendingRemoval.kind === 'recurring' ? ' e não lança mais sozinho' : ''}. Os lançamentos que já entraram não são apagados.`
          : ''}
        confirmLabel="Remover"
        onConfirm={handleConfirmRemoval}
        onCancel={() => setPendingRemoval(null)}
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
  const [signupEmail, setSignupEmail] = useState(null)
  const [resetting, setResetting] = useState(false)
  const { submitting, error, setError, signIn, signUp, resetPassword } = useFinance()
  const { t } = usePreferences()

  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    try {
      if (mode === 'signin') {
        await signIn(authForm)
        setAuthForm({ email: '', password: '' })
      } else {
        const result = await signUp(authForm)
        if (result?.requiresEmailVerification) {
          setSignupEmail(authForm.email)
        } else {
          toast.success('Conta criada! Agora entre com seu email e senha.')
          setMode('signin')
        }
        setAuthForm({ email: '', password: '' })
      }
    } catch (authError) {
      setError(authError.message)
    }
  }

  const handleFieldChange = (field) => (event) => {
    setAuthForm((prev) => ({ ...prev, [field]: event.target.value }))
    if (error) setError(null)
  }

  if (signupEmail) {
    return (
      <LoginScreen variant="signup">
        <section className="w-full rounded-3xl border border-emerald-300/20 bg-emerald-950/35 p-6 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="text-2xl font-bold">Conta criada!</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Enviamos um link de confirmação para <strong className="text-emerald-200">{signupEmail}</strong>.
            Abra seu e-mail, clique no link para ativar a conta e depois volte aqui para entrar.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Não achou o e-mail? Confira a caixa de spam ou o lixo eletrônico — às vezes ele cai lá.
          </p>
          <button
            type="button"
            onClick={() => {
              setSignupEmail(null)
              setMode('signin')
              setError(null)
            }}
            className="mt-5 w-full rounded-lg bg-emerald-400 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Voltar para entrar
          </button>
        </section>
      </LoginScreen>
    )
  }

  const handlePasswordReset = async () => {
    if (!authForm.email) {
      setError('Informe seu email para redefinir a senha.')
      return
    }
    if (resetting) return

    setResetting(true)
    try {
      await resetPassword(authForm.email)
      toast.success('Enviamos um link para redefinir sua senha.')
    } catch (resetError) {
      setError(resetError.message)
    } finally {
      setResetting(false)
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
            onChange={handleFieldChange('email')}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Senha"
            value={authForm.password}
            onChange={handleFieldChange('password')}
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
              disabled={resetting}
              className="text-sm text-slate-300 underline-offset-2 transition hover:text-cyan-300 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting ? 'Enviando...' : t('forgotPassword')}
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
  const [inviteName, setInviteName] = useState('')
  const [confirmInvite, setConfirmInvite] = useState(null)
  const { submitting, error, setError, bootstrapFamilyGroup, pendingGroupInvites, acceptGroupInvite } = useFinance()
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

  const handleAcceptInvite = async () => {
    if (!confirmInvite) return

    try {
      await acceptGroupInvite({ inviteId: confirmInvite.invite_id, fullName: inviteName })
      toast.success(`Você entrou no grupo ${confirmInvite.group_name}!`)
      setConfirmInvite(null)
    } catch (acceptError) {
      setError(acceptError.message)
      setConfirmInvite(null)
    }
  }

  return (
    <LoginScreen>
      <section className="w-full rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold">{t('setupGroupTitle')}</h1>
        <p className="mt-1 text-sm text-slate-400">{t('setupGroupSubtitle')}</p>

        {pendingGroupInvites.length > 0 && (
          <div className="mt-5 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-4">
            <p className="text-sm font-semibold text-cyan-100">Você foi convidado para um grupo!</p>
            <p className="mt-1 text-xs text-cyan-200/80">
              Se alguém da sua família já usa o MyDinDin, entre no grupo dela em vez de criar um novo.
            </p>

            <input
              type="text"
              placeholder="Seu nome completo"
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm"
            />

            <div className="mt-3 space-y-2">
              {pendingGroupInvites.map((invite) => (
                <div
                  key={invite.invite_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-300/20 bg-slate-950/50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{invite.group_name}</p>
                    <p className="text-[11px] text-slate-400">
                      {invite.expires_at
                        ? `Convite válido até ${new Date(invite.expires_at).toLocaleDateString('pt-BR')}`
                        : 'Convite sem prazo de validade'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setConfirmInvite(invite)}
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Entrar neste grupo
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-slate-400">ou crie seu próprio grupo abaixo</p>
          </div>
        )}

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
              onChange={(event) => {
                setSetupForm((prev) => ({ ...prev, groupName: event.target.value }))
                if (error) setError(null)
              }}
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
              onChange={(event) => {
                setSetupForm((prev) => ({ ...prev, fullName: event.target.value }))
                if (error) setError(null)
              }}
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

        <ConfirmDialog
          open={Boolean(confirmInvite)}
          title={`Entrar no grupo ${confirmInvite?.group_name || ''}?`}
          message={'Você entra como membro e passa a compartilhar os lançamentos com o grupo.\n\nSe um dia quiser sair, é só usar a opção "Sair do grupo" na aba Usuário.'}
          confirmLabel="Entrar no grupo"
          busy={submitting}
          onConfirm={handleAcceptInvite}
          onCancel={() => setConfirmInvite(null)}
        />
      </section>
    </LoginScreen>
  )
}
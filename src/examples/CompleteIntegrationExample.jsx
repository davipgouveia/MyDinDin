import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Settings } from 'lucide-react'

// Importar todos os componentes e hooks
import Logo from './components/Logo'
import { DailyStatsCard, MonthlyStatsCard } from './components/StatsCards'
import { PaymentRemindersSection, RecurringPaymentsSection } from './components/RemindersSection'
import { CategoriesManager } from './components/CategoriesManager'
import { AIRecommendationsPanel, BudgetAlertPanel } from './components/AIRecommendations'
import { AdvancedTransactionModal } from './components/AdvancedTransactionModal'
import { useTransactionCategory } from './context/TransactionCategoryContext'
import { useFinancialAI, useFinancialBudget } from './hooks/useFinancialAI'
import { useDailyMonthlyStats, useCategoryStats } from './hooks/useStats'
import { ToastProvider, toast } from './hooks/useToast'

/**
 * EXEMPLO DE INTEGRAÇÃO COMPLETA
 * Este é um exemplo de como usar todos os novos recursos do FinançasAPP
 */

export function CompleteFinancialDashboard() {
  // Estados
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [transactionType, setTransactionType] = useState('expense')
  const [activeTab, setActiveTab] = useState('overview') // overview, categories, reminders, ai

  // Contextos e Hooks
  const {
    paymentReminders,
    removePaymentReminder,
    updatePaymentReminder,
    recurringPayments,
    removeRecurringPayment,
    addCustomCategory,
    getOrderedCategories,
    saveCategoryOrder,
  } = useTransactionCategory()

  const { recommendations, dismissRecommendation, insights } = useFinancialAI()
  const { budgets, addBudget, getBudgetStatus } = useFinancialBudget()
  const stats = useDailyMonthlyStats()
  const categoryStats = useCategoryStats()

  // Handlers
  const handleAddTransaction = (formData) => {
    console.log('Nova transação:', formData)

    // Se é pagamento recorrente
    if (formData.isRecurring) {
      toast.success('Pagamento recorrente criado!')
    } else {
      toast.success('Transação adicionada com sucesso!')
    }

    setIsTransactionModalOpen(false)
  }

  const handleOpenTransaction = (type) => {
    setTransactionType(type)
    setIsTransactionModalOpen(true)
  }

  const handleAddCustomCategory = (category) => {
    addCustomCategory(category)
  }

  const handleReorderCategories = (newOrder) => {
    saveCategoryOrder(newOrder)
  }

  const handleRemoveReminder = (reminderId) => {
    removePaymentReminder(reminderId)
  }

  const handleCompleteReminder = (reminderId) => {
    updatePaymentReminder(reminderId, { completed: true })
    toast.success('Lembrete marcado como concluído!')
  }

  const handleRemoveRecurring = (paymentId) => {
    removeRecurringPayment(paymentId)
  }

  const upcomingReminders = paymentReminders.filter((r) => !r.completed).slice(0, 5)

  // Variantes de animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <ToastProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-slate-950 p-4 sm:p-6"
      >
        {/* Header com Logo */}
        <motion.div
          variants={itemVariants}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Logo size="large" />
            <div>
              <h1 className="text-2xl font-bold text-slate-100">FinançasAPP</h1>
              <p className="text-sm text-slate-400">Gestão financeira inteligente</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenTransaction('expense')}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 font-medium text-white hover:from-cyan-600 hover:to-blue-600"
          >
            <Plus size={18} />
            Nova Transação
          </motion.button>
        </motion.div>

        {/* Abas de Navegação */}
        <motion.div variants={itemVariants} className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Visão Geral' },
            { id: 'categories', label: '📁 Categorias' },
            { id: 'reminders', label: '🔔 Lembretes' },
            { id: 'ai', label: '🤖 IA & Orçamento' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Conteúdo por Aba */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Visão Geral */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <motion.div variants={itemVariants}>
                  <DailyStatsCard />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <MonthlyStatsCard />
                </motion.div>
              </div>

              {/* Reminders préximos */}
              {upcomingReminders.length > 0 && (
                <motion.div variants={itemVariants}>
                  <PaymentRemindersSection
                    reminders={upcomingReminders}
                    onDelete={handleRemoveReminder}
                    onComplete={handleCompleteReminder}
                  />
                </motion.div>
              )}

              {/* Pagamentos Recorrentes */}
              {recurringPayments.length > 0 && (
                <motion.div variants={itemVariants}>
                  <RecurringPaymentsSection
                    payments={recurringPayments}
                    onDelete={handleRemoveRecurring}
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* Categorias */}
          {activeTab === 'categories' && (
            <motion.div variants={itemVariants} className="card-gradient">
              <CategoriesManager
                categories={getOrderedCategories('expense')}
                onReorder={handleReorderCategories}
                onAddCustom={handleAddCustomCategory}
              />
            </motion.div>
          )}

          {/* Lembretes e Recorrentes */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="card-gradient">
                <PaymentRemindersSection
                  reminders={paymentReminders}
                  onDelete={handleRemoveReminder}
                  onComplete={handleCompleteReminder}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="card-gradient">
                <RecurringPaymentsSection
                  payments={recurringPayments}
                  onDelete={handleRemoveRecurring}
                />
              </motion.div>
            </div>
          )}

          {/* IA e Orçamento */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <motion.div variants={itemVariants} className="card-gradient">
                <AIRecommendationsPanel
                  recommendations={recommendations}
                  onDismiss={dismissRecommendation}
                />
              </motion.div>

              {getBudgetStatus && getBudgetStatus.length > 0 && (
                <motion.div variants={itemVariants} className="card-gradient">
                  <BudgetAlertPanel budgets={getBudgetStatus} />
                </motion.div>
              )}

              {/* Insights */}
              <motion.div variants={itemVariants} className="card-gradient">
                <h3 className="mb-4 text-sm font-semibold text-slate-300">
                  Análise Financeira
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-xs text-slate-400">Renda Total</p>
                    <p className="mt-1 text-lg font-bold text-green-400">
                      R$ {insights.totalIncome?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-xs text-slate-400">Gastos Total</p>
                    <p className="mt-1 text-lg font-bold text-red-400">
                      R$ {insights.totalExpenses?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-xs text-slate-400">Taxa Poupança</p>
                    <p className="mt-1 text-lg font-bold text-blue-400">
                      {insights.savingsRate?.toFixed(1) || '0'}%
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Modal de Transação Avançado */}
        <AdvancedTransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSubmit={handleAddTransaction}
          transactionType={transactionType}
        />
      </motion.div>
    </ToastProvider>
  )
}

export default CompleteFinancialDashboard

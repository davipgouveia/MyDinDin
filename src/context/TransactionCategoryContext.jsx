import { createContext, useContext, useState, useEffect } from 'react'
import { useFinance } from './FinanceContext'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories'
import { toast } from 'sonner'

const TransactionCategoryContext = createContext(null)

export function TransactionCategoryProvider({ children }) {
  const { user } = useFinance()
  const [categories, setCategories] = useState(EXPENSE_CATEGORIES)
  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES)
  const [customCategories, setCustomCategories] = useState([])
  const [dailyStats, setDailyStats] = useState({})
  const [monthlyStats, setMonthlyStats] = useState({})
  const [paymentReminders, setPaymentReminders] = useState([])
  const [recurringPayments, setRecurringPayments] = useState([])
  const [categoryOrder, setCategoryOrder] = useState([])
  const [savedCategoryOrder, setSavedCategoryOrder] = useState([])

  // Carregar categorias customizadas do localStorage
  useEffect(() => {
    if (user?.id) {
      const storedCustom = localStorage.getItem(`custom_categories_${user.id}`)
      const storedOrder = localStorage.getItem(`category_order_${user.id}`)
      const storedReminders = localStorage.getItem(`payment_reminders_${user.id}`)
      const storedRecurring = localStorage.getItem(`recurring_payments_${user.id}`)

      if (storedCustom) {
        setCustomCategories(JSON.parse(storedCustom))
      }
      if (storedOrder) {
        setSavedCategoryOrder(JSON.parse(storedOrder))
      }
      if (storedReminders) {
        setPaymentReminders(JSON.parse(storedReminders))
      }
      if (storedRecurring) {
        setRecurringPayments(JSON.parse(storedRecurring))
      }
    }
  }, [user?.id])

  // Adicionar categoria customizada
  const addCustomCategory = (category) => {
    const newCategory = {
      id: `custom_${Date.now()}`,
      ...category,
      isCustom: true,
    }

    const updated = [...customCategories, newCategory]
    setCustomCategories(updated)
    localStorage.setItem(`custom_categories_${user?.id}`, JSON.stringify(updated))
    toast.success(`Categoria "${category.name}" criada!`)
    return newCategory
  }

  // Remover categoria customizada
  const removeCustomCategory = (categoryId) => {
    const updated = customCategories.filter((cat) => cat.id !== categoryId)
    setCustomCategories(updated)
    localStorage.setItem(`custom_categories_${user?.id}`, JSON.stringify(updated))
    toast.success('Categoria removida!')
  }

  // Obter todas as categorias (padrão + customizadas)
  const getAllCategories = (type = 'expense') => {
    const defaultCats = type === 'income' ? incomeCategories : categories
    if (type === 'income') return defaultCats
    return [...defaultCats, ...customCategories]
  }

  // Salvar ordenação customizada de categorias
  const saveCategoryOrder = (order) => {
    setSavedCategoryOrder(order)
    localStorage.setItem(`category_order_${user?.id}`, JSON.stringify(order))
    toast.success('Ordem de categorias salva!')
  }

  // Obter categorias na ordem customizada
  const getOrderedCategories = (type = 'expense') => {
    const allCats = getAllCategories(type)
    if (!savedCategoryOrder.length) return allCats

    const ordered = []
    const remaining = [...allCats]

    for (const id of savedCategoryOrder) {
      const index = remaining.findIndex((cat) => cat.id === id)
      if (index !== -1) {
        ordered.push(remaining[index])
        remaining.splice(index, 1)
      }
    }

    return [...ordered, ...remaining]
  }

  // Adicionar lembrete de pagamento
  const addPaymentReminder = (reminder) => {
    const newReminder = {
      id: `reminder_${Date.now()}`,
      ...reminder,
      createdAt: new Date().toISOString(),
    }

    const updated = [...paymentReminders, newReminder]
    setPaymentReminders(updated)
    localStorage.setItem(`payment_reminders_${user?.id}`, JSON.stringify(updated))
    toast.success('Lembrete criado!')
    return newReminder
  }

  // Remover lembrete
  const removePaymentReminder = (reminderId) => {
    const updated = paymentReminders.filter((r) => r.id !== reminderId)
    setPaymentReminders(updated)
    localStorage.setItem(`payment_reminders_${user?.id}`, JSON.stringify(updated))
    toast.success('Lembrete removido!')
  }

  // Atualizar lembrete
  const updatePaymentReminder = (reminderId, updates) => {
    const updated = paymentReminders.map((r) =>
      r.id === reminderId ? { ...r, ...updates } : r,
    )
    setPaymentReminders(updated)
    localStorage.setItem(`payment_reminders_${user?.id}`, JSON.stringify(updated))
  }

  // Obter lembretes próximos
  const getUpcomingReminders = (daysAhead = 7) => {
    const now = new Date()
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    return paymentReminders.filter((reminder) => {
      if (!reminder.dueDate) return false
      const dueDate = new Date(reminder.dueDate)
      return dueDate >= now && dueDate <= future
    })
  }

  // Adicionar pagamento recorrente
  const addRecurringPayment = (payment) => {
    const newPayment = {
      id: `recurring_${Date.now()}`,
      ...payment,
      createdAt: new Date().toISOString(),
      nextDueDate: payment.nextDueDate || payment.startDate,
    }

    const updated = [...recurringPayments, newPayment]
    setRecurringPayments(updated)
    localStorage.setItem(`recurring_payments_${user?.id}`, JSON.stringify(updated))
    toast.success('Pagamento recorrente criado!')
    return newPayment
  }

  // Remover pagamento recorrente
  const removeRecurringPayment = (paymentId) => {
    const updated = recurringPayments.filter((p) => p.id !== paymentId)
    setRecurringPayments(updated)
    localStorage.setItem(`recurring_payments_${user?.id}`, JSON.stringify(updated))
    toast.success('Pagamento recorrente removido!')
  }

  // Atualizar pagamento recorrente
  const updateRecurringPayment = (paymentId, updates) => {
    const updated = recurringPayments.map((p) =>
      p.id === paymentId ? { ...p, ...updates } : p,
    )
    setRecurringPayments(updated)
    localStorage.setItem(`recurring_payments_${user?.id}`, JSON.stringify(updated))
  }

  // Gerar próximas datas de um pagamento recorrente
  const getNextRecurringDates = (payment, months = 3) => {
    const dates = []
    let currentDate = new Date(payment.nextDueDate || payment.startDate)

    for (let i = 0; i < months; i++) {
      switch (payment.frequency) {
        case 'diaria':
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
          break
        case 'semanal':
          currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case 'quinzenal':
          currentDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000)
          break
        case 'mensal':
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
        case 'trimestral':
          currentDate.setMonth(currentDate.getMonth() + 3)
          break
        case 'semestral':
          currentDate.setMonth(currentDate.getMonth() + 6)
          break
        case 'anual':
          currentDate.setFullYear(currentDate.getFullYear() + 1)
          break
      }
      dates.push(new Date(currentDate))
    }

    return dates
  }

  const value = {
    // Categorias
    categories,
    incomeCategories,
    customCategories,
    getAllCategories,
    addCustomCategory,
    removeCustomCategory,
    getOrderedCategories,

    // Ordenação
    categoryOrder,
    setCategoryOrder,
    saveCategoryOrder,
    savedCategoryOrder,

    // Lembretes
    paymentReminders,
    addPaymentReminder,
    removePaymentReminder,
    updatePaymentReminder,
    getUpcomingReminders,

    // Pagamentos Recorrentes
    recurringPayments,
    addRecurringPayment,
    removeRecurringPayment,
    updateRecurringPayment,
    getNextRecurringDates,

    // Stats
    dailyStats,
    setDailyStats,
    monthlyStats,
    setMonthlyStats,
  }

  return (
    <TransactionCategoryContext.Provider value={value}>
      {children}
    </TransactionCategoryContext.Provider>
  )
}

export function useTransactionCategory() {
  const context = useContext(TransactionCategoryContext)
  if (!context) {
    throw new Error(
      'useTransactionCategory deve ser usado dentro de TransactionCategoryProvider',
    )
  }
  return context
}

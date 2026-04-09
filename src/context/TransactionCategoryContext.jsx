import { createContext, useContext, useState, useEffect } from 'react'
import { useFinance } from './FinanceContext'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { isWebhookConfigured, sendWebhookAlert } from '../lib/webhookAlerts'
import { toast } from 'sonner'
import { parseDateValue } from '../utils/date'

const TransactionCategoryContext = createContext(null)
const BACKUP_TYPES = {
  customCategories: 'custom_categories',
  categoryOrder: 'category_order',
  reminders: 'payment_reminders',
  recurring: 'recurring_payments',
}

export function TransactionCategoryProvider({ children }) {
  const { user, profile } = useFinance()
  const [categories, setCategories] = useState(EXPENSE_CATEGORIES)
  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES)
  const [customCategories, setCustomCategories] = useState([])
  const [dailyStats, setDailyStats] = useState({})
  const [monthlyStats, setMonthlyStats] = useState({})
  const [paymentReminders, setPaymentReminders] = useState([])
  const [recurringPayments, setRecurringPayments] = useState([])
  const [categoryOrder, setCategoryOrder] = useState([])
  const [savedCategoryOrder, setSavedCategoryOrder] = useState([])

  const persistBackup = async (type, payload) => {
    if (!user?.id) return

    const localStorageKey = `${type}_${user.id}`
    localStorage.setItem(localStorageKey, JSON.stringify(payload))

    if (!isSupabaseConfigured || !supabase || !profile?.group_id) return

    const { error: upsertError } = await supabase
      .from('app_backups')
      .upsert(
        {
          user_id: user.id,
          group_id: profile.group_id,
          data_type: type,
          payload,
        },
        { onConflict: 'user_id,data_type' },
      )

    if (upsertError && upsertError.code !== '42P01') {
      console.warn(`Falha ao sincronizar backup ${type}:`, upsertError.message)
    }
  }

  // Carregar backups locais
  useEffect(() => {
    if (user?.id) {
      const storedCustom = localStorage.getItem(`${BACKUP_TYPES.customCategories}_${user.id}`)
      const storedOrder = localStorage.getItem(`${BACKUP_TYPES.categoryOrder}_${user.id}`)
      const storedReminders = localStorage.getItem(`${BACKUP_TYPES.reminders}_${user.id}`)
      const storedRecurring = localStorage.getItem(`${BACKUP_TYPES.recurring}_${user.id}`)

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

  // Carregar backups remotos do Supabase (quando disponivel)
  useEffect(() => {
    const loadRemoteBackups = async () => {
      if (!user?.id || !profile?.group_id || !isSupabaseConfigured || !supabase) return

      const { data, error } = await supabase
        .from('app_backups')
        .select('data_type, payload')
        .eq('user_id', user.id)

      if (error) {
        if (error.code !== '42P01') {
          console.warn('Falha ao carregar backups remotos:', error.message)
        }
        return
      }

      const backupMap = new Map((data || []).map((row) => [row.data_type, row.payload]))

      const remoteCustom = backupMap.get(BACKUP_TYPES.customCategories)
      const remoteOrder = backupMap.get(BACKUP_TYPES.categoryOrder)
      const remoteReminders = backupMap.get(BACKUP_TYPES.reminders)
      const remoteRecurring = backupMap.get(BACKUP_TYPES.recurring)

      if (Array.isArray(remoteCustom)) {
        setCustomCategories(remoteCustom)
        localStorage.setItem(`${BACKUP_TYPES.customCategories}_${user.id}`, JSON.stringify(remoteCustom))
      }
      if (Array.isArray(remoteOrder)) {
        setSavedCategoryOrder(remoteOrder)
        localStorage.setItem(`${BACKUP_TYPES.categoryOrder}_${user.id}`, JSON.stringify(remoteOrder))
      }
      if (Array.isArray(remoteReminders)) {
        setPaymentReminders(remoteReminders)
        localStorage.setItem(`${BACKUP_TYPES.reminders}_${user.id}`, JSON.stringify(remoteReminders))
      }
      if (Array.isArray(remoteRecurring)) {
        setRecurringPayments(remoteRecurring)
        localStorage.setItem(`${BACKUP_TYPES.recurring}_${user.id}`, JSON.stringify(remoteRecurring))
      }
    }

    loadRemoteBackups()
  }, [profile?.group_id, user?.id])

  // Adicionar categoria customizada
  const addCustomCategory = (category) => {
    const newCategory = {
      id: `custom_${Date.now()}`,
      ...category,
      isCustom: true,
    }

    const updated = [...customCategories, newCategory]
    setCustomCategories(updated)
    persistBackup(BACKUP_TYPES.customCategories, updated)
    toast.success(`Categoria "${category.name}" criada!`)
    return newCategory
  }

  // Remover categoria customizada
  const removeCustomCategory = (categoryId) => {
    const updated = customCategories.filter((cat) => cat.id !== categoryId)
    setCustomCategories(updated)
    persistBackup(BACKUP_TYPES.customCategories, updated)
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
    persistBackup(BACKUP_TYPES.categoryOrder, order)
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
    persistBackup(BACKUP_TYPES.reminders, updated)

    const dueDate = parseDateValue(reminder.dueDate)
    if (dueDate && isWebhookConfigured()) {
      const now = new Date()
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 3) {
        sendWebhookAlert({
          event: 'payment_reminder_urgent',
          title: reminder.description || 'Lembrete urgente',
          dueDate: dueDate.toISOString(),
          daysLeft,
          amount: Number(reminder.amount) || 0,
        }).catch((webhookError) => {
          console.warn('Falha ao enviar webhook de lembrete urgente:', webhookError.message)
        })
      }
    }

    toast.success('Lembrete criado!')
    return newReminder
  }

  // Remover lembrete
  const removePaymentReminder = (reminderId) => {
    const updated = paymentReminders.filter((r) => r.id !== reminderId)
    setPaymentReminders(updated)
    persistBackup(BACKUP_TYPES.reminders, updated)
    toast.success('Lembrete removido!')
  }

  // Atualizar lembrete
  const updatePaymentReminder = (reminderId, updates) => {
    const updated = paymentReminders.map((r) =>
      r.id === reminderId ? { ...r, ...updates } : r,
    )
    setPaymentReminders(updated)
    persistBackup(BACKUP_TYPES.reminders, updated)
  }

  // Obter lembretes próximos
  const getUpcomingReminders = (daysAhead = 7) => {
    const now = new Date()
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    return paymentReminders.filter((reminder) => {
      if (!reminder.dueDate) return false
      const dueDate = parseDateValue(reminder.dueDate)
      if (!dueDate) return false
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
    persistBackup(BACKUP_TYPES.recurring, updated)
    toast.success('Pagamento recorrente criado!')
    return newPayment
  }

  // Remover pagamento recorrente
  const removeRecurringPayment = (paymentId) => {
    const updated = recurringPayments.filter((p) => p.id !== paymentId)
    setRecurringPayments(updated)
    persistBackup(BACKUP_TYPES.recurring, updated)
    toast.success('Pagamento recorrente removido!')
  }

  // Atualizar pagamento recorrente
  const updateRecurringPayment = (paymentId, updates) => {
    const updated = recurringPayments.map((p) =>
      p.id === paymentId ? { ...p, ...updates } : p,
    )
    setRecurringPayments(updated)
    persistBackup(BACKUP_TYPES.recurring, updated)
  }

  // Gerar próximas datas de um pagamento recorrente
  const getNextRecurringDates = (payment, months = 3) => {
    const dates = []
    const startDate = parseDateValue(payment.nextDueDate || payment.startDate)
    if (!startDate) return dates

    let currentDate = new Date(startDate)

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

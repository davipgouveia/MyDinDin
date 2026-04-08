import { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'

export function useDailyMonthlyStats() {
  const { visibleTransactions } = useFinance()

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const dailyExpenses = []
    const dailyIncomes = []
    const monthlyByCategory = {}

    // Inicializar os 30 últimos dias
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyExpenses.push({ date: dateStr, value: 0 })
      dailyIncomes.push({ date: dateStr, value: 0 })
    }

    visibleTransactions.forEach((transaction) => {
      const transDate = new Date(transaction.created_at)
      transDate.setHours(0, 0, 0, 0)
      const dateStr = transDate.toISOString().split('T')[0]

      const amount = Math.abs(parseFloat(transaction.amount) || 0)

      if (transaction.type === 'expense') {
        // Atualizar stats diários
        const dailyIndex = dailyExpenses.findIndex((d) => d.date === dateStr)
        if (dailyIndex !== -1) {
          dailyExpenses[dailyIndex].value += amount
        }

        // Atualizar stats mensais por categoria
        if (transDate >= monthStart && transDate <= monthEnd) {
          const category = transaction.category || 'outros'
          monthlyByCategory[category] = (monthlyByCategory[category] || 0) + amount
        }
      } else if (transaction.type === 'income') {
        // Atualizar stats diários de renda
        const dailyIndex = dailyIncomes.findIndex((d) => d.date === dateStr)
        if (dailyIndex !== -1) {
          dailyIncomes[dailyIndex].value += amount
        }
      }
    })

    // Calcular totais
    const totalDailyExpenses = dailyExpenses.reduce((sum, d) => sum + d.value, 0)
    const totalDailyIncomes = dailyIncomes.reduce((sum, d) => sum + d.value, 0)
    const totalMonthlyExpenses = Object.values(monthlyByCategory).reduce(
      (sum, val) => sum + val,
      0,
    )

    // Calcular média
    const avgDailyExpense = totalDailyExpenses / dailyExpenses.length
    const avgDailyIncome = totalDailyIncomes / dailyIncomes.length

    // Encontrar maior gasto do mês
    const largestExpenseCategory = Object.entries(monthlyByCategory).sort(
      ([, a], [, b]) => b - a,
    )[0]

    return {
      // Dados brutos
      dailyExpenses,
      dailyIncomes,
      monthlyByCategory,

      // Totais
      totalDailyExpenses,
      totalDailyIncomes,
      totalMonthlyExpenses,
      balance: totalDailyIncomes - totalDailyExpenses,
      monthlyBalance: totalDailyIncomes - totalMonthlyExpenses,

      // Médias
      avgDailyExpense,
      avgDailyIncome,
      avgDailyBalance: avgDailyIncome - avgDailyExpense,

      // Maiores gastos do mês
      largestExpenseCategory: largestExpenseCategory
        ? { category: largestExpenseCategory[0], amount: largestExpenseCategory[1] }
        : null,

      // Período
      dateRange: {
        start: monthStart,
        end: monthEnd,
      },
    }
  }, [visibleTransactions])

  return stats
}

export function useCategoryStats() {
  const { visibleTransactions } = useFinance()

  const stats = useMemo(() => {
    const categoryStats = {}

    visibleTransactions.forEach((transaction) => {
      const category = transaction.category || 'outros'
      const amount = Math.abs(parseFloat(transaction.amount) || 0)

      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          count: 0,
          transactions: [],
          percentage: 0,
        }
      }

      categoryStats[category].total += amount
      categoryStats[category].count += 1
      categoryStats[category].transactions.push(transaction)
    })

    const totalAmount = Object.values(categoryStats).reduce(
      (sum, cat) => sum + cat.total,
      0,
    )

    // Calcular percentual
    Object.entries(categoryStats).forEach(([, stat]) => {
      stat.percentage = totalAmount > 0 ? (stat.total / totalAmount) * 100 : 0
    })

    return categoryStats
  }, [visibleTransactions])

  return stats
}

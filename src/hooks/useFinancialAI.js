import { useMemo, useState, useCallback } from 'react'
import { useFinance } from '../context/FinanceContext'
import { toast } from 'sonner'

export function useFinancialAI() {
  const { visibleTransactions } = useFinance()
  const [recommendations, setRecommendations] = useState([])
  const [insights, setInsights] = useState({})

  const generateInsights = useCallback(() => {
    const thisMonth = new Date()
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)

    const monthlyTransactions = visibleTransactions.filter((t) => {
      const tDate = new Date(t.created_at)
      return tDate >= startOfMonth
    })

    const categoryExpenses = {}
    const dailyExpenses = {}
    let totalIncome = 0
    let totalExpenses = 0

    monthlyTransactions.forEach((t) => {
      const amount = parseFloat(t.amount) || 0
      const category = t.category || 'outros'
      const dateStr = new Date(t.created_at).toISOString().split('T')[0]

      if (t.type === 'expense') {
        totalExpenses += Math.abs(amount)
        categoryExpenses[category] = (categoryExpenses[category] || 0) + Math.abs(amount)
        dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + Math.abs(amount)
      } else {
        totalIncome += amount
      }
    })

    const newRecommendations = []
    const newInsights = {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      categoryExpenses,
      dailyExpenses,
    }

    // Análise 1: Identificar categoria com maior gasto
    const topCategory = Object.entries(categoryExpenses).sort(([, a], [, b]) => b - a)[0]
    if (topCategory && topCategory[1] > newInsights.totalExpenses * 0.3) {
      newRecommendations.push({
        id: 'high_category',
        type: 'warning',
        title: 'Categoria com alto gasto',
        description: `${topCategory[0]} representa ${((topCategory[1] / newInsights.totalExpenses) * 100).toFixed(0)}% dos seus gastos. Considere reduzir ou revisar essas despesas.`,
        priority: 'high',
        action: `Analisar gastos em ${topCategory[0]}`,
      })
    }

    // Análise 2: Verificar taxa de poupança
    if (newInsights.savingsRate < 10 && newInsights.savingsRate >= 0) {
      newRecommendations.push({
        id: 'low_savings',
        type: 'warning',
        title: 'Taxa de poupança baixa',
        description: `Você está poupando apenas ${newInsights.savingsRate.toFixed(1)}% da sua renda. Tente aumentar a poupança para pelo menos 20%.`,
        priority: 'high',
        action: 'Revisar orçamento',
      })
    } else if (newInsights.savingsRate >= 20) {
      newRecommendations.push({
        id: 'good_savings',
        type: 'success',
        title: 'Excelente taxa de poupança',
        description: `Parabéns! Você está poupando ${newInsights.savingsRate.toFixed(1)}% da sua renda. Continue assim!`,
        priority: 'low',
        action: 'Manter o ritmo',
      })
    }

    // Análise 3: Detectar padrões de gastos diários
    const dailyValues = Object.values(dailyExpenses).filter((v) => v > 0)
    if (dailyValues.length > 0) {
      const avgDaily = dailyValues.reduce((a, b) => a + b) / dailyValues.length
      const maxDaily = Math.max(...dailyValues)

      if (maxDaily > avgDaily * 1.5) {
        newRecommendations.push({
          id: 'spending_spike',
          type: 'info',
          title: 'Picos de gasto detectados',
          description: `Detectamos variações significativas nos seus gastos diários. A média é R$ ${avgDaily.toFixed(2)}, mas alguns dias ultrapassam R$ ${maxDaily.toFixed(2)}.`,
          priority: 'medium',
          action: 'Investigar causas',
        })
      }
    }

    // Análise 4: Sugestão de categorias com baixo gasto
    const allCategories = [
      'alimentacao',
      'transporte',
      'saude',
      'educacao',
      'lazer',
      'contas',
      'shopping',
    ]
    const unusedCategories = allCategories.filter((cat) => !(cat in categoryExpenses))

    if (unusedCategories.length > 0 && Object.keys(categoryExpenses).length > 3) {
      newRecommendations.push({
        id: 'budget_optimization',
        type: 'success',
        title: 'Oportunidade de diversificação',
        description: `Você está gastando bem. Considere alocar um orçamento pequeno para ${unusedCategories.slice(0, 2).join(', ')} para melhor rastreamento.`,
        priority: 'low',
        action: 'Criar novo orçamento',
      })
    }

    // Análise 5: Balanço negativo
    if (newInsights.balance < 0) {
      newRecommendations.push({
        id: 'negative_balance',
        type: 'error',
        title: 'Déficit financeiro',
        description: `Você está gastando mais do que ganha este mês. Déficit: R$ ${Math.abs(newInsights.balance).toFixed(2)}. Aja rapidamente!`,
        priority: 'critical',
        action: 'Criar plano de ação',
      })
    }

    // Análise 6: Sugestão de metas de poupança
    if (newInsights.balance > 0 && newInsights.savingsRate < 30) {
      const suggestedSavings = (newInsights.totalIncome * 0.3).toFixed(2)
      newRecommendations.push({
        id: 'savings_goal',
        type: 'success',
        title: 'Meta de poupança sugerida',
        description: `Com sua renda atual, você poderia poupar até R$ ${suggestedSavings} por mês (30% da renda).`,
        priority: 'medium',
        action: 'Estabelecer meta',
      })
    }

    setInsights(newInsights)
    setRecommendations(newRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }))

    return {
      recommendations: newRecommendations,
      insights: newInsights,
    }
  }, [visibleTransactions])

  // Gerar insights automaticamente
  useMemo(() => {
    generateInsights()
  }, [visibleTransactions, generateInsights])

  const dismissRecommendation = useCallback((id) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const getActionableRecommendations = useCallback(() => {
    return recommendations.filter((r) => ['warning', 'error'].includes(r.type))
  }, [recommendations])

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500/10 border-red-500/30 text-red-400',
      high: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      low: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    }
    return colors[priority] || colors.low
  }

  const getTypeIcon = (type) => {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
    }
    return icons[type] || '📌'
  }

  return {
    recommendations,
    insights,
    generateInsights,
    dismissRecommendation,
    getActionableRecommendations,
    getPriorityColor,
    getTypeIcon,
  }
}

export function useFinancialBudget() {
  const [budgets, setBudgets] = useState([])
  const { visibleTransactions } = useFinance()

  const addBudget = (category, limit, period = 'mensal') => {
    const budget = {
      id: `budget_${Date.now()}`,
      category,
      limit,
      period,
      createdAt: new Date().toISOString(),
    }
    setBudgets((prev) => [...prev, budget])
    toast.success(`Orçamento criado para ${category}`)
    return budget
  }

  const removeBudget = (budgetId) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId))
    toast.success('Orçamento removido')
  }

  const getBudgetStatus = useMemo(() => {
    return budgets.map((budget) => {
      const spent = visibleTransactions
        .filter((t) => t.category === budget.category && t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)

      const percentage = (spent / budget.limit) * 100
      const remaining = budget.limit - spent

      return {
        ...budget,
        spent,
        percentage,
        remaining,
        status: spent > budget.limit ? 'exceeded' : percentage > 80 ? 'warning' : 'ok',
      }
    })
  }, [budgets, visibleTransactions])

  return {
    budgets,
    addBudget,
    removeBudget,
    getBudgetStatus,
  }
}

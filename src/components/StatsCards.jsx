import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

export function DailyStatsCard() {
  // Importado do hook useStats
  const stats = {
    totalDailyExpenses: Math.random() * 500,
    totalDailyIncomes: Math.random() * 1000,
    avgDailyExpense: Math.random() * 100,
  }

  const balance = stats.totalDailyIncomes - stats.totalDailyExpenses
  const isPositive = balance >= 0

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-4"
    >
      <div className="mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300">Resumo do Dia</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Gastos do dia */}
        <motion.div
          variants={itemVariants}
          className="rounded-lg bg-slate-900/50 p-3"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingDown size={14} className="text-red-400" />
            Gastos
          </div>
          <div className="mt-1 text-lg font-bold text-red-400">
            R$ {stats.totalDailyExpenses.toFixed(2)}
          </div>
        </motion.div>

        {/* Rendas do dia */}
        <motion.div
          variants={itemVariants}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-slate-900/50 p-3"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp size={14} className="text-green-400" />
            Rendas
          </div>
          <div className="mt-1 text-lg font-bold text-green-400">
            R$ {stats.totalDailyIncomes.toFixed(2)}
          </div>
        </motion.div>

        {/* Saldo do dia */}
        <motion.div
          variants={itemVariants}
          transition={{ delay: 0.2 }}
          className="col-span-2 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 p-3"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <DollarSign size={14} className={isPositive ? 'text-green-400' : 'text-red-400'} />
            Saldo do Dia
          </div>
          <div className={`mt-1 text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            R$ {balance.toFixed(2)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export function MonthlyStatsCard() {
  const stats = {
    totalMonthlyExpenses: Math.random() * 3000,
    avgDailyExpense: Math.random() * 100,
    largestExpenseCategory: { category: 'alimentacao', amount: Math.random() * 500 },
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-4"
    >
      <div className="mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300">Resumo do Mês</h3>
      </div>

      <div className="space-y-3">
        {/* Total mensal */}
        <motion.div variants={itemVariants} className="rounded-lg bg-slate-900/50 p-3">
          <div className="text-xs text-slate-400">Total de Gastos</div>
          <div className="mt-1 text-lg font-bold text-red-400">
            R$ {stats.totalMonthlyExpenses.toFixed(2)}
          </div>
        </motion.div>

        {/* Média diária */}
        <motion.div
          variants={itemVariants}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-slate-900/50 p-3"
        >
          <div className="text-xs text-slate-400">Média Diária</div>
          <div className="mt-1 text-lg font-bold text-orange-400">
            R$ {stats.avgDailyExpense.toFixed(2)}
          </div>
        </motion.div>

        {/* Maior gasto */}
        {stats.largestExpenseCategory && (
          <motion.div
            variants={itemVariants}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 p-3"
          >
            <div className="text-xs text-slate-400">Maior Categoria</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                {stats.largestExpenseCategory.category}
              </span>
              <span className="font-bold text-yellow-400">
                R$ {stats.largestExpenseCategory.amount.toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

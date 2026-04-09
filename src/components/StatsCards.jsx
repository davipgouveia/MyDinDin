import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDailyMonthlyStats } from '../hooks/useStats'

const dailyContainerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const monthlyContainerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
  },
}

const statsItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

export function DailyStatsCard() {
  const { totalDailyExpenses, totalDailyIncomes, balance } = useDailyMonthlyStats()
  const isPositive = balance >= 0

  return (
    <motion.div
      variants={dailyContainerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-4"
    >
      <div className="mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300">Resumo do Dia</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div variants={statsItemVariants} className="rounded-lg bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingDown size={14} className="text-red-400" />
            Gastos
          </div>
          <div className="mt-1 text-lg font-bold text-red-400">
            R$ {totalDailyExpenses.toFixed(2)}
          </div>
        </motion.div>

        <motion.div
          variants={statsItemVariants}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-slate-900/50 p-3"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp size={14} className="text-green-400" />
            Rendas
          </div>
          <div className="mt-1 text-lg font-bold text-green-400">
            R$ {totalDailyIncomes.toFixed(2)}
          </div>
        </motion.div>

        <motion.div
          variants={statsItemVariants}
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
  const { totalMonthlyExpenses, avgDailyExpense, largestExpenseCategory } = useDailyMonthlyStats()

  return (
    <motion.div
      variants={monthlyContainerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-4"
    >
      <div className="mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300">Resumo do Mês</h3>
      </div>

      <div className="space-y-3">
        <motion.div variants={statsItemVariants} className="rounded-lg bg-slate-900/50 p-3">
          <div className="text-xs text-slate-400">Total de Gastos</div>
          <div className="mt-1 text-lg font-bold text-red-400">
            R$ {totalMonthlyExpenses.toFixed(2)}
          </div>
        </motion.div>

        <motion.div
          variants={statsItemVariants}
          transition={{ delay: 0.1 }}
          className="rounded-lg bg-slate-900/50 p-3"
        >
          <div className="text-xs text-slate-400">Média Diária</div>
          <div className="mt-1 text-lg font-bold text-orange-400">
            R$ {avgDailyExpense.toFixed(2)}
          </div>
        </motion.div>

        {largestExpenseCategory && (
          <motion.div
            variants={statsItemVariants}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 p-3"
          >
            <div className="text-xs text-slate-400">Maior Categoria</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-semibold text-slate-200">{largestExpenseCategory.category}</span>
              <span className="font-bold text-yellow-400">
                R$ {largestExpenseCategory.amount.toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export function AdvancedStatsCharts() {
  const { monthlyComparison, dailyBalance } = useDailyMonthlyStats()

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 xl:grid-cols-2"
    >
      <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Comparativo dos últimos 6 meses</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.75rem',
                }}
              />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Tendência de saldo diário (30 dias)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyBalance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.75rem',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Saldo diário"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.section>
  )
}

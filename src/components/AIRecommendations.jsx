import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export function AIRecommendationsPanel({ recommendations = [], onDismiss = () => {} }) {
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
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.9,
    },
  }

  const getTypeIcon = (type) => {
    const iconProps = { size: 18 }
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-400" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-yellow-400" />
      case 'error':
        return <AlertTriangle {...iconProps} className="text-red-400" />
      case 'info':
        return <Info {...iconProps} className="text-blue-400" />
      default:
        return <Lightbulb {...iconProps} className="text-cyan-400" />
    }
  }

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-500/5'
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5'
      case 'error':
        return 'border-red-500/30 bg-red-500/5'
      case 'info':
        return 'border-blue-500/30 bg-blue-500/5'
      default:
        return 'border-cyan-500/30 bg-cyan-500/5'
    }
  }

  if (!recommendations.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 py-8"
      >
        <Lightbulb size={32} className="mb-2 text-cyan-400/30" />
        <p className="text-sm text-slate-500">Nenhuma recomendação no momento</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Lightbulb size={18} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300">Recomendações de IA</h3>
      </div>

      <AnimatePresence>
        {recommendations.map((rec) => (
          <motion.div
            key={rec.id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`flex gap-3 rounded-lg border p-3 ${getBackgroundColor(rec.type)}`}
          >
            <div className="mt-0.5 flex-shrink-0">{getTypeIcon(rec.type)}</div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-200">{rec.title}</h4>
              <p className="mt-1 text-xs text-slate-400">{rec.description}</p>

              {rec.action && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-2 inline-block rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-white/20"
                >
                  {rec.action}
                </motion.button>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDismiss(rec.id)}
              className="mt-0.5 flex-shrink-0 text-slate-500 hover:text-slate-300"
            >
              <X size={16} />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export function BudgetAlertPanel({ budgets = [] }) {
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
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'border-red-500/30 bg-red-500/5'
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5'
      default:
        return 'border-green-500/30 bg-green-500/5'
    }
  }

  const getProgressColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'from-red-500 to-red-600'
      case 'warning':
        return 'from-yellow-500 to-yellow-600'
      default:
        return 'from-green-500 to-green-600'
    }
  }

  if (!budgets.length) {
    return null
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      <h4 className="text-xs font-semibold uppercase text-slate-400">Orçamentos</h4>

      {budgets.map((budget) => (
        <motion.div
          key={budget.id}
          variants={itemVariants}
          className={`rounded-lg border p-3 ${getStatusColor(budget.status)}`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-200">{budget.category}</span>
            <span className="text-slate-400">
              R$ {budget.spent.toFixed(2)} / R$ {budget.limit.toFixed(2)}
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${getProgressColor(budget.status)}`}
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>{budget.percentage.toFixed(0)}% utilizado</span>
            {budget.remaining >= 0 ? (
              <span className="text-green-400">R$ {budget.remaining.toFixed(2)} restante</span>
            ) : (
              <span className="text-red-400">Excedido em R$ {Math.abs(budget.remaining).toFixed(2)}</span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

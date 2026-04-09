import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Trash2, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react'
import { formatDateBR, parseDateValue } from '../utils/date'

const reminderContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const reminderItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

const recurringContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const recurringItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

function getDaysLeft(dueDate) {
  const now = new Date()
  const due = parseDateValue(dueDate)
  if (!due) return null
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24))
}

export function PaymentRemindersSection({ reminders = [], onDelete = () => {}, onComplete = () => {} }) {
  const getUrgencyColor = (dueDate) => {
    const daysLeft = getDaysLeft(dueDate)
    if (daysLeft === null) return 'border-slate-600/40 bg-slate-800/20'

    if (daysLeft <= 1) return 'border-red-500/30 bg-red-500/5'
    if (daysLeft <= 3) return 'border-yellow-500/30 bg-yellow-500/5'
    return 'border-blue-500/30 bg-blue-500/5'
  }

  const getUrgencyIcon = (dueDate) => {
    const daysLeft = getDaysLeft(dueDate)
    if (daysLeft === null) return <Calendar size={16} className="text-slate-400" />

    if (daysLeft <= 1) return <AlertCircle size={16} className="text-red-400" />
    if (daysLeft <= 3) return <Clock size={16} className="text-yellow-400" />
    return <Calendar size={16} className="text-blue-400" />
  }

  if (!reminders.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center"
      >
        <p className="text-sm text-slate-400">Nenhum lembrete configurado</p>
      </motion.div>
    )
  }

  return (
    <motion.div variants={reminderContainerVariants} initial="hidden" animate="visible">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Bell size={16} className="text-cyan-400" />
        Lembretes de Pagamento
      </h3>

      <div className="space-y-2">
        <AnimatePresence>
          {reminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              variants={reminderItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={{ x: 4 }}
              className={`flex items-center justify-between rounded-lg border p-3 transition-all ${getUrgencyColor(reminder.dueDate)}`}
            >
              <div className="flex flex-1 items-center gap-3">
                {getUrgencyIcon(reminder.dueDate)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {reminder.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDateBR(reminder.dueDate, 'Sem data definida')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onComplete(reminder.id)}
                  className="rounded-lg bg-green-500/10 p-2 text-green-400 hover:bg-green-500/20"
                >
                  <CheckCircle2 size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete(reminder.id)}
                  className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function RecurringPaymentsSection({ payments = [], onDelete = () => {}, onEdit = () => {} }) {
  if (!payments.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center"
      >
        <p className="text-sm text-slate-400">Nenhum pagamento recorrente</p>
      </motion.div>
    )
  }

  return (
    <motion.div variants={recurringContainerVariants} initial="hidden" animate="visible">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Clock size={16} className="text-purple-400" />
        Pagamentos Recorrentes
      </h3>

      <div className="space-y-2">
        <AnimatePresence>
          {payments.map((payment) => (
            <motion.div
              key={payment.id}
              variants={recurringItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-purple-500/5 p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">{payment.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <Calendar size={12} />
                  <span>{payment.frequency}</span>
                  <span>•</span>
                  <span>R$ {payment.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit(payment.id)}
                  className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/20"
                >
                  Editar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete(payment.id)}
                  className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

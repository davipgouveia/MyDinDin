import { motion } from 'framer-motion'
import { formatCurrency } from '../utils/format'

export default function SummaryCard({ title, value, subtitle, highlight = false }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-2xl p-4 ${
        highlight ? 'bg-cyan-500/20 shadow-glow' : 'bg-slate-900/70'
      } backdrop-blur-sm`}
      style={
        highlight
          ? {
              backgroundImage: 'linear-gradient(135deg, rgb(var(--accent-rgb) / 0.2), rgb(var(--accent-strong-rgb) / 0.12))',
              boxShadow: '0 16px 40px rgb(var(--accent-rgb) / 0.18)',
            }
          : undefined
      }
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.06 }}
        className="text-xs uppercase tracking-[0.18em] text-slate-400"
      >
        {title}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-2 text-2xl font-semibold text-slate-50"
      >
        {formatCurrency(value)}
      </motion.p>
      {subtitle ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14 }}
          className="mt-1 text-sm text-slate-300"
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.article>
  )
}

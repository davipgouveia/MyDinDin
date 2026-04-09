import { motion } from 'framer-motion'
import { Home, ChartColumnBig, Tags, Bell, UserRound, Plus, Sparkles } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'

export function MobileBottomNav({ activePage, onNavigate, onQuickAdd }) {
  const { t } = usePreferences()

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'stats', label: t('stats'), icon: ChartColumnBig },
    { id: 'categories', label: t('categories'), icon: Tags },
    { id: 'add', label: t('add'), icon: Plus, primary: true },
    { id: 'reminders', label: t('reminders'), icon: Bell },
    { id: 'ai', label: t('ai'), icon: Sparkles },
    { id: 'user', label: t('user'), icon: UserRound },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/80 bg-slate-950/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-7 items-end gap-1">
        {navItems.map((item) => {
          if (item.primary) {
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={onQuickAdd}
                className="mx-auto flex h-14 w-14 -translate-y-4 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.35)]"
                aria-label="Adicionar transação"
              >
                <Plus size={24} strokeWidth={2.6} />
              </motion.button>
            )
          }

          const Icon = item.icon
          const isActive = activePage === item.id

          return (
            <motion.button
              key={item.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1.5 py-2 text-[9px] font-medium transition ${
                isActive ? 'text-cyan-300' : 'text-slate-500'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition ${
                  isActive
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-900/80 text-slate-400'
                }`}
              >
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
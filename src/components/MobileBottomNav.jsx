import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, ChartColumnBig, UserRound, Plus, PanelsTopLeft, Bell, Sparkles, Tags, X } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'

export function MobileBottomNav({ activePage, onNavigate, onQuickAdd }) {
  const { t } = usePreferences()
  const [moreOpen, setMoreOpen] = useState(false)

  const groupedPages = ['categories', 'reminders', 'ai']

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'stats', label: t('stats'), icon: ChartColumnBig },
    { id: 'add', label: t('add'), icon: Plus, primary: true },
    { id: 'more', label: 'Mais', icon: PanelsTopLeft },
    { id: 'user', label: t('user'), icon: UserRound },
  ]

  const moreItems = [
    { id: 'categories', label: t('categories'), icon: Tags },
    { id: 'reminders', label: t('reminders'), icon: Bell },
    { id: 'ai', label: t('ai'), icon: Sparkles },
  ]

  const handleNavigate = (page) => {
    onNavigate(page)
    setMoreOpen(false)
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/80 bg-slate-950/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {navItems.map((item) => {
          if (item.primary) {
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={onQuickAdd}
                className="button-primary relative mx-auto flex h-16 w-16 -translate-y-5 items-center justify-center rounded-2xl border border-cyan-200/20 shadow-[0_10px_24px_rgba(34,211,238,0.24)]"
                aria-label="Adicionar transação"
              >
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.2),rgba(255,255,255,0)_70%)]" />
                <Plus size={26} strokeWidth={2.8} />
              </motion.button>
            )
          }

          const Icon = item.icon
          const isMoreItemActive = item.id === 'more' && groupedPages.includes(activePage)
          const isActive = activePage === item.id || isMoreItemActive

          return (
            <motion.button
              key={item.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => {
                if (item.id === 'more') {
                  setMoreOpen((current) => !current)
                  return
                }
                handleNavigate(item.id)
              }}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-medium transition ${
                isActive ? 'text-cyan-300' : 'text-slate-500'
              }`}
            >
              <span
                className={`flex h-8.5 w-8.5 items-center justify-center rounded-2xl border transition ${
                  isActive
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-900/80 text-slate-400'
                }`}
              >
                <Icon size={16} />
              </span>
              <span className="max-w-[44px] truncate leading-none">{item.label}</span>
            </motion.button>
          )
        })}
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-3 md:hidden"
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 22, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-3 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Acessos rápidos</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-full border border-slate-700 bg-slate-900 p-1.5 text-slate-400"
                  aria-label="Fechar menu"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {moreItems.map((item) => {
                  const ItemIcon = item.icon
                  const itemActive = activePage === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${
                        itemActive
                          ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                          : 'border-slate-800 bg-slate-900/70 text-slate-300'
                      }`}
                    >
                      <ItemIcon size={18} />
                      <span className="text-[11px] font-medium leading-none">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
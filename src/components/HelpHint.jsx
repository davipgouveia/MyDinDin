import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function HelpHint({ text }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-[11px] font-bold text-cyan-300"
        aria-label="Mostrar explicação"
        title="Mostrar explicação"
      >
        ?
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute left-7 top-0 z-50 w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-left text-[11px] text-slate-200 shadow-2xl"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

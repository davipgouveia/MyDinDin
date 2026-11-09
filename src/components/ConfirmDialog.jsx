import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

export function ConfirmDialog({
  open = false,
  title = 'Confirmar',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  busy = false,
  onConfirm = () => {},
  onCancel = () => {},
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-slate-950/70 p-4 md:items-center md:justify-center"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-[1.75rem] border border-slate-800 bg-slate-950 p-5 shadow-2xl md:max-w-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full p-2 ${danger ? 'bg-red-500/10 text-red-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
                  <AlertTriangle size={16} />
                </span>
                <h3 className="text-base font-semibold text-slate-100">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-slate-700 bg-slate-900 p-1.5 text-slate-400"
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">{message}</p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  danger ? 'bg-red-400 hover:bg-red-300' : 'bg-cyan-500 hover:bg-cyan-400'
                }`}
              >
                {busy ? 'Aguarde...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

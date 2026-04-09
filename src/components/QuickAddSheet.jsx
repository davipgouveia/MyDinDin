import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react'
import { HelpHint } from './HelpHint'

export function QuickAddSheet({ open = false, onClose = () => {}, onSelectType = () => {} }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-slate-950/70 p-4 md:items-center md:justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-[1.75rem] border border-slate-800 bg-slate-950 p-4 shadow-2xl md:max-w-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Novo lançamento</p>
                  <HelpHint text="Selecione se você quer registrar uma despesa ou uma receita. Depois, complete os detalhes no formulário." />
                </div>
                <h3 className="text-lg font-semibold text-white">Escolha o tipo</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-400"
                aria-label="Fechar ações rápidas"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelectType('expense')}
                className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-left text-white"
              >
                <ArrowDownCircle className="text-red-300" />
                <div>
                  <p className="text-sm font-semibold">Despesa</p>
                  <p className="mt-1 text-xs text-slate-300">Registrar gasto ou conta.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectType('income')}
                className="flex flex-col items-start gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-left text-white"
              >
                <ArrowUpCircle className="text-green-300" />
                <div>
                  <p className="text-sm font-semibold">Receita</p>
                  <p className="mt-1 text-xs text-slate-300">Registrar entrada de dinheiro.</p>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
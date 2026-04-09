import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, FREQUENCY_OPTIONS } from '../constants/categories'
import { HelpHint } from './HelpHint'

const getTodayDate = () => new Date().toISOString().split('T')[0]

const buildInitialFormData = (transactionType = 'expense') => ({
  description: '',
  amount: '',
  category: transactionType === 'expense' ? 'alimentacao' : 'salario',
  date: getTodayDate(),
  dueDate: '',
  paymentMethod: 'credito',
  isPaid: true,
  isRecurring: false,
  frequency: 'mensal',
  endDate: '',
  notes: '',
})

export function AdvancedTransactionModal({
  isOpen = false,
  onClose = () => {},
  onSubmit = () => {},
  transactionType = 'expense',
}) {
  const [formData, setFormData] = useState(() => buildInitialFormData(transactionType))

  const categories = transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const isIncome = transactionType === 'income'

  useEffect(() => {
    if (!isOpen) return

    setFormData(buildInitialFormData(transactionType))
  }, [isOpen, transactionType])

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await Promise.resolve(onSubmit(formData))
      setFormData(buildInitialFormData(transactionType))
      onClose()
    } catch {
      // O erro ja e tratado no contexto/toast; evita promise rejeitada sem tratamento.
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.form
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">
                {transactionType === 'expense' ? 'Nova Despesa' : 'Novo Rendimento'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-800/50 p-1 text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-300">Descrição</label>
                <HelpHint text="Descreva em poucas palavras o lançamento para facilitar buscas." />
              </div>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Ex: Compra de comida"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-300">Valor (R$)</label>
                <HelpHint text="Valor total do lançamento. Use apenas números e centavos." />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-300">Categoria</label>
                <HelpHint text="Escolha a categoria correta para melhorar estatísticas e alertas." />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: category.id })}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${
                      formData.category === category.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-xs text-slate-300">{category.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-300">Data</label>
                  <HelpHint text="Dia em que a receita/despesa ocorreu ou foi registrada." />
                </div>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-300">{isIncome ? 'Previsão de recebimento (opcional)' : 'Vencimento (opcional)'}</label>
                  <HelpHint text={isIncome ? 'Use para receitas futuras, como salários ou repasses com data prevista.' : 'Use para contas a pagar; ajuda nos lembretes de prazo.'} />
                </div>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-300">{isIncome ? 'Recebimento' : 'Pagamento'}</label>
                  <HelpHint text={isIncome ? 'Escolha como esse valor foi recebido para manter o histórico completo.' : 'Escolha como o lançamento foi pago para manter o histórico mais completo.'} />
                </div>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="credito">💳 Crédito</option>
                  <option value="debito">🏦 Débito</option>
                  <option value="pix">📱 PIX</option>
                  <option value="transferencia">💸 Transferência</option>
                </select>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="alreadyPaid"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="h-4 w-4 cursor-pointer rounded border-slate-600"
              />
              <label htmlFor="alreadyPaid" className="cursor-pointer text-xs font-medium text-slate-300">
                {isIncome ? 'Já foi recebido' : 'Já foi pago'}
              </label>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 cursor-pointer rounded border-slate-600"
              />
              <label htmlFor="recurring" className="cursor-pointer text-xs font-medium text-slate-300">
                Pagamento recorrente
              </label>
              <HelpHint text="Ative quando o lançamento se repetir em intervalos fixos, como mensalmente." />
            </div>

            {formData.isRecurring && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <label className="text-xs font-medium text-slate-300">Frequência</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                <label className="mt-2 block text-xs font-medium text-slate-300">
                  Data de Encerramento (opcional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </motion.div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-300">Notas</label>
                <HelpHint text="Use este campo para observações extras que ajudem no controle futuro." />
              </div>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full resize-none rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Adicione notas sobre essa transação"
                rows="2"
              />
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800/50 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-600"
              >
                <Plus size={16} />
                Adicionar
              </motion.button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

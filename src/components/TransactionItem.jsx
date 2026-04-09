import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, MessageCircle, Send, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/format'

export default function TransactionItem({
  transaction,
  onDelete,
  canDelete = true,
  comments = [],
  onAddComment = () => {},
}) {
  const [newComment, setNewComment] = useState('')
  const [commentsOpen, setCommentsOpen] = useState(false)
  const isIncome = transaction.type === 'income'
  const isPaid = transaction.isPaid !== false

  const handleCommentSubmit = async (event) => {
    event.preventDefault()
    if (!newComment.trim()) return

    try {
      await onAddComment(transaction.id, newComment)
      setNewComment('')
      setCommentsOpen(true)
    } catch {
      // Erros exibidos via toast no chamador.
    }
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {isIncome ? (
            <ArrowUpCircle className="mt-0.5 text-income" size={18} />
          ) : (
            <ArrowDownCircle className="mt-0.5 text-expense" size={18} />
          )}
          <div>
            <p className="text-sm font-medium text-slate-100">{transaction.description}</p>
            <p className="text-xs text-slate-400">
              {transaction.category} • {transaction.owner} • {formatDate(transaction.date)}
              {transaction.dueDate ? ` • vence ${formatDate(transaction.dueDate)}` : ''}
              {transaction.dueDate ? ` • ${isPaid ? 'pago' : 'em aberto'}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.p
            initial={{ scale: 0.96, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className={`text-sm font-semibold ${isIncome ? 'text-income' : 'text-expense'}`}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </motion.p>
          <button
            type="button"
            onClick={() => setCommentsOpen((current) => !current)}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Ver comentários"
          >
            <MessageCircle size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Excluir transacao"
            disabled={!canDelete}
            title={canDelete ? 'Excluir transação' : 'Apenas o autor ou owner pode excluir'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {commentsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-3 space-y-2 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/70 p-3"
          >
          <form className="flex items-center gap-2" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Adicionar comentário"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200"
            />
            <button
              type="submit"
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/15 p-2 text-cyan-200"
              aria-label="Enviar comentário"
            >
              <Send size={12} />
            </button>
          </form>

          {comments.length > 0 ? (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
              }}
              className="space-y-1.5"
            >
              {comments.map((comment) => (
                <motion.li
                  key={comment.id}
                  variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                  className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5"
                >
                  <p className="text-xs text-slate-200">{comment.content}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {comment.author} • {formatDate(comment.createdAt)}
                  </p>
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <p className="text-xs text-slate-500">Sem comentários nesta transação.</p>
          )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

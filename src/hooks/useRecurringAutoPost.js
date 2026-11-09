import { useEffect, useRef } from 'react'
import { normalizeText } from '../lib/quickParse'
import { parseDateValue } from '../utils/date'
import { toast } from './useToast'

const toISODate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function advanceRecurringDate(dateISO, frequency) {
  const base = parseDateValue(dateISO)
  if (!base) return dateISO

  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  switch (frequency) {
    case 'diaria':
      next.setDate(next.getDate() + 1)
      break
    case 'semanal':
      next.setDate(next.getDate() + 7)
      break
    case 'quinzenal':
      next.setDate(next.getDate() + 14)
      break
    case 'trimestral':
      next.setMonth(next.getMonth() + 3)
      break
    case 'semestral':
      next.setMonth(next.getMonth() + 6)
      break
    case 'anual':
      next.setFullYear(next.getFullYear() + 1)
      break
    case 'mensal':
    default:
      next.setMonth(next.getMonth() + 1)
      break
  }

  return toISODate(next)
}

const MAX_CYCLES_PER_PAYMENT = 12

// Contas fixas com "lancar sozinho" ativo: quando o vencimento chega, a
// transacao nasce pronta no grupo e a proxima data avanca um periodo.
// A checagem de duplicidade (mesma descricao + valor + mes no grupo)
// evita lancar duas vezes se duas pessoas abrirem o app no mesmo dia.
export function useRecurringAutoPost({
  enabled = false,
  recurringPayments = [],
  transactions = [],
  addTransaction,
  updateRecurringPayment,
}) {
  const processedRef = useRef(new Set())
  const runningRef = useRef(false)

  useEffect(() => {
    if (!enabled || runningRef.current) return
    if (!addTransaction || !updateRecurringPayment) return

    const todayISO = toISODate(new Date())
    const duePayments = recurringPayments.filter((payment) => {
      if (payment.autoPost !== true) return false
      const dueISO = String(payment.nextDueDate || payment.startDate || '').slice(0, 10)
      if (!dueISO || dueISO > todayISO) return false
      const endISO = payment.endDate ? String(payment.endDate).slice(0, 10) : null
      if (endISO && dueISO > endISO) return false
      return !processedRef.current.has(`${payment.id}:${dueISO}`)
    })

    if (duePayments.length === 0) return

    runningRef.current = true

    ;(async () => {
      let postedCount = 0

      for (const payment of duePayments) {
        let dueISO = String(payment.nextDueDate || payment.startDate).slice(0, 10)
        const endISO = payment.endDate ? String(payment.endDate).slice(0, 10) : null
        let cycles = 0

        while (dueISO <= todayISO && (!endISO || dueISO <= endISO) && cycles < MAX_CYCLES_PER_PAYMENT) {
          processedRef.current.add(`${payment.id}:${dueISO}`)

          const amount = Math.abs(Number(payment.amount) || 0)
          const monthKey = dueISO.slice(0, 7)
          const alreadyThere = transactions.some((tx) => {
            const txDate = String(tx.date || '').slice(0, 7)
            return (
              txDate === monthKey
              && normalizeText(tx.description) === normalizeText(payment.name)
              && Math.abs(Number(tx.amount) || 0) === amount
            )
          })

          if (!alreadyThere && amount > 0) {
            try {
              await addTransaction({
                type: payment.type === 'income' ? 'income' : 'expense',
                description: payment.name,
                amount,
                category: payment.category || (payment.type === 'income' ? 'Salário' : 'Contas & Serviços'),
                date: dueISO,
                dueDate: null,
                isPaid: true,
                source: 'recurring',
              })
              postedCount += 1
            } catch (postError) {
              console.warn('Falha ao lancar conta fixa automaticamente:', postError.message)
              break
            }
          }

          dueISO = advanceRecurringDate(dueISO, payment.frequency)
          cycles += 1
        }

        if (cycles > 0) {
          updateRecurringPayment(payment.id, {
            nextDueDate: dueISO,
            lastAutoPostedAt: new Date().toISOString(),
          })
        }
      }

      if (postedCount > 0) {
        toast.success(
          postedCount === 1
            ? '1 conta fixa foi lançada sozinha, como você configurou.'
            : `${postedCount} contas fixas foram lançadas sozinhas, como você configurou.`,
        )
      }
    })().finally(() => {
      runningRef.current = false
    })
  }, [enabled, recurringPayments, transactions, addTransaction, updateRecurringPayment])
}

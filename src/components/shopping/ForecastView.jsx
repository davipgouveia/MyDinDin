"use client"

import { Hourglass, Plus, Flag } from 'lucide-react'
import * as shop from '../../lib/shopping'
import { fmtDate } from './ShoppingModule'

const STATUS_STYLE = {
  acabou: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  acabando: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  sem_dados: 'border-slate-700 bg-slate-800/40 text-slate-400',
}

const STATUS_LABEL = {
  acabou: 'Acabou',
  acabando: 'Acabando',
  ok: 'Ok',
  sem_dados: 'Sem dados',
}

export function ForecastView({ user, groupId, forecasts, reload, panelClass, toast }) {
  async function markFinished(product) {
    try {
      await shop.markFinished(groupId, user.id, product.id)
      await reload()
      toast.success(`${product.name} marcado como "acabou".`)
    } catch (err) {
      toast.error(err.message || 'Não foi possível marcar.')
    }
  }

  async function addToList(product) {
    try {
      await shop.addListItem(groupId, user, { product: product.name, quantity: 1 })
      await reload()
      toast.success(`${product.name} entrou na lista.`)
    } catch (err) {
      toast.error(err.message || 'Não foi possível adicionar.')
    }
  }

  return (
    <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
      <div className="mb-1 flex items-center gap-2">
        <Hourglass size={17} className="text-cyan-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Previsão de término</h3>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Estimativa pelo seu ritmo de compra: manual (duração definida no produto), marcações de "acabou" ou
        intervalo entre compras. Precisa de 2 compras do produto, ou 1 compra + 1 "acabou".
      </p>

      {forecasts.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          Nenhum produto de consumo ainda. Registre compras para a previsão começar a funcionar.
        </p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {forecasts.map(({ product, forecast }) => (
            <li key={product.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="text-xs text-slate-500">
                  {forecast.status === 'sem_dados'
                    ? 'Compre mais uma vez (ou marque "acabou") para prever.'
                    : forecast.status === 'acabou'
                      ? 'Estoque estimado zerado.'
                      : `~${forecast.estimated_remaining} ${product.unit || 'un'} restantes · acaba em ${fmtDate(forecast.run_out_date)}`}
                  {forecast.days_per_unit ? ` · 1 un dura ~${Math.round(forecast.days_per_unit)} dias` : ''}
                </p>
              </div>
              {forecast.days_left != null && forecast.status !== 'sem_dados' && (
                <span className="text-sm font-bold text-slate-200">
                  {forecast.status === 'acabou' ? '0' : Math.ceil(forecast.days_left)}d
                </span>
              )}
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[forecast.status]}`}>
                {STATUS_LABEL[forecast.status]}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => markFinished(product)}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-rose-400/50 hover:text-rose-300"
                >
                  <Flag size={13} /> Acabou
                </button>
                <button
                  type="button"
                  onClick={() => addToList(product)}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
                >
                  <Plus size={13} /> Lista
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

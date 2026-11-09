'use client'

import { Sparkles } from 'lucide-react'
import { QuickCapture } from './QuickCapture'
import { StatementImport } from './StatementImport'

// Tela de primeiro passo: aparece SOMENTE quando o grupo ainda não tem
// nenhum lançamento. Em vez do painel cheio de zeros (que trava quem
// abre o app pela primeira vez), mostra UMA missão: importar o extrato
// ou a fatura pra tirar o atraso de uma vez. Entrou o primeiro
// lançamento, esta tela some e o painel normal assume.
export function FirstStep({ transactions, categories, learnedMap, onImport, onQuickSubmit, panelClass, isLight }) {
  return (
    <section className="grid gap-4">
      <section className={`rounded-[1.75rem] border p-6 text-center md:p-8 ${panelClass}`}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
          <Sparkles size={22} />
        </div>
        <h2 className="text-xl font-bold md:text-2xl">Vamos tirar o atraso em 2 minutos</h2>
        <p className={`mx-auto mt-2 max-w-xl text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          Seu painel está vazio porque ainda não entrou nenhum lançamento — e tudo bem,
          ninguém começa digitando gasto por gasto. O jeito rápido é{' '}
          <strong>importar o extrato do banco ou a fatura do cartão</strong>:
          um arquivo só e o seu mês aparece aqui, sem digitar nada.
        </p>
      </section>

      <StatementImport
        transactions={transactions}
        categories={categories}
        learnedMap={learnedMap}
        onImport={onImport}
        panelClass={panelClass}
      />

      <div className="flex items-center gap-3 px-1" aria-hidden="true">
        <span className={`h-px flex-1 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
        <span className={`text-[11px] font-medium uppercase tracking-[0.18em] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          ou comece por um gasto de hoje
        </span>
        <span className={`h-px flex-1 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
      </div>

      <QuickCapture
        categories={categories}
        learnedMap={learnedMap}
        onSubmit={onQuickSubmit}
        panelClass={panelClass}
      />

      <p className={`px-1 text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
        Sem pressa e sem culpa: o que entrar sem categoria fica numa filinha pra você classificar depois, com 1 toque.
      </p>
    </section>
  )
}

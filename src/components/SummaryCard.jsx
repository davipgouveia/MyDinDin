import { formatCurrency } from '../utils/format'

export default function SummaryCard({ title, value, subtitle, highlight = false }) {
  return (
    <article
      className={`rounded-2xl p-4 ${
        highlight ? 'bg-cyan-500/20 shadow-glow' : 'bg-slate-900/70'
      } backdrop-blur-sm`}
      style={
        highlight
          ? {
              backgroundImage: 'linear-gradient(135deg, rgb(var(--accent-rgb) / 0.2), rgb(var(--accent-strong-rgb) / 0.12))',
              boxShadow: '0 16px 40px rgb(var(--accent-rgb) / 0.18)',
            }
          : undefined
      }
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{formatCurrency(value)}</p>
      {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
    </article>
  )
}

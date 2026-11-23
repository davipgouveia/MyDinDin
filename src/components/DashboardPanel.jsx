import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, GripVertical, Minus, Plus } from 'lucide-react'
import { spanPercent } from '../lib/dashboardLayout'

// Moldura de um painel do dashboard. Fora do modo de edição é invisível
// (só posiciona o painel na grade). No modo de edição, mostra a barra de
// ferramentas: arrastar pela alça, mover com as setas e ajustar a largura.
export function DashboardPanel({
  id,
  label,
  span,
  editing,
  isFirst,
  isLast,
  onMove,
  onSpanChange,
  onReorder,
  children,
}) {
  const armedRef = useRef(false)
  const [dropHint, setDropHint] = useState(false)

  const toolbarButton =
    'rounded-md p-1 text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div
      className={`dash-panel min-w-0 ${
        editing
          ? `rounded-[1.75rem] outline-dashed outline-2 outline-offset-4 ${
              dropHint ? 'outline-cyan-300' : 'outline-cyan-400/40'
            }`
          : ''
      }`}
      style={{ '--span': span }}
      draggable={editing}
      onDragStart={(event) => {
        if (!armedRef.current) {
          event.preventDefault()
          return
        }
        event.dataTransfer.setData('text/plain', id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      onDragEnd={() => {
        armedRef.current = false
      }}
      onDragOver={(event) => {
        if (!editing) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setDropHint(true)
      }}
      onDragLeave={() => setDropHint(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDropHint(false)
        const fromId = event.dataTransfer.getData('text/plain')
        if (!fromId || fromId === id) return
        const rect = event.currentTarget.getBoundingClientRect()
        const ratio =
          (event.clientX - rect.left) / Math.max(rect.width, 1) +
          (event.clientY - rect.top) / Math.max(rect.height, 1)
        onReorder(fromId, id, ratio < 1)
      }}
    >
      {editing && (
        <div className="mb-2 flex flex-wrap items-center gap-1 rounded-xl bg-slate-800/95 px-2 py-1.5 text-xs shadow-lg">
          <button
            type="button"
            aria-label={`Arrastar o painel ${label}`}
            title="Segure e arraste para mover"
            className="cursor-grab touch-none rounded-md p-1 text-slate-300 transition hover:bg-slate-700 hover:text-white active:cursor-grabbing"
            onPointerDown={() => {
              armedRef.current = true
            }}
            onPointerUp={() => {
              armedRef.current = false
            }}
            onPointerCancel={() => {
              armedRef.current = false
            }}
          >
            <GripVertical size={14} />
          </button>
          <span className="mr-1 max-w-[11rem] truncate font-medium text-slate-100">{label}</span>
          <span className="mx-1 h-4 w-px bg-slate-600" aria-hidden="true" />
          <button
            type="button"
            aria-label={`Mover ${label} para antes`}
            title="Mover para antes"
            className={toolbarButton}
            disabled={isFirst}
            onClick={() => onMove(id, -1)}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label={`Mover ${label} para depois`}
            title="Mover para depois"
            className={toolbarButton}
            disabled={isLast}
            onClick={() => onMove(id, 1)}
          >
            <ChevronRight size={14} />
          </button>
          <span className="mx-1 h-4 w-px bg-slate-600" aria-hidden="true" />
          <button
            type="button"
            aria-label={`Diminuir a largura de ${label}`}
            title="Diminuir a largura"
            className={toolbarButton}
            onClick={() => onSpanChange(id, -1)}
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center tabular-nums text-slate-200">{spanPercent(span)}%</span>
          <button
            type="button"
            aria-label={`Aumentar a largura de ${label}`}
            title="Aumentar a largura"
            className={toolbarButton}
            onClick={() => onSpanChange(id, 1)}
          >
            <Plus size={14} />
          </button>
        </div>
      )}
      <div className={editing ? 'pointer-events-none select-none' : undefined}>{children}</div>
    </div>
  )
}

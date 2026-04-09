import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function HelpHint({ text }) {
  const [open, setOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const [verticalOffset, setVerticalOffset] = useState(0)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open || !rootRef.current) return

    const buttonRect = rootRef.current.getBoundingClientRect()
    const tooltipWidth = 224
    const margin = 12

    setAlignRight(buttonRect.left + 28 + tooltipWidth > window.innerWidth - margin)

    if (buttonRect.top < 84) {
      setVerticalOffset(8)
    } else {
      setVerticalOffset(0)
    }

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    return () => window.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-[11px] font-bold text-cyan-300 transition hover:scale-105 hover:border-cyan-300/60 hover:bg-cyan-400/20"
        aria-label="Mostrar explicação"
        title="Mostrar explicação"
      >
        ?
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ top: `${verticalOffset}px` }}
            className={`absolute z-50 w-[min(14rem,calc(100vw-2.5rem))] rounded-xl border border-slate-700/90 bg-slate-950/95 px-3 py-2 text-left text-[11px] leading-5 text-slate-100 shadow-[0_24px_44px_rgba(2,6,23,0.55)] backdrop-blur-xl ${
              alignRight ? 'right-7' : 'left-7'
            }`}
          >
            <div className={`absolute top-2 h-2 w-2 rotate-45 border-l border-t border-slate-700 bg-slate-950/95 ${alignRight ? '-right-1' : '-left-1'}`} />
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

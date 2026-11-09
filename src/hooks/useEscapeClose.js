import { useEffect } from 'react'

// Fecha modais/folhas com a tecla ESC — saida padrao de teclado que o
// app nao tinha em nenhum modal.
export function useEscapeClose(open, onClose) {
  useEffect(() => {
    if (!open || !onClose) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])
}

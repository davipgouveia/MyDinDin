import { Toaster, toast } from 'sonner'

export { toast }

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors={true}
      theme="dark"
      closeButton={true}
      duration={3000}
    />
  )
}

export const toastMessages = {
  success: (message) =>
    toast.success(message || 'Operação realizada com sucesso!'),
  error: (message) => toast.error(message || 'Ocorreu um erro!'),
  loading: (message) => toast.loading(message || 'Carregando...'),
  promise: (promise, messages) => toast.promise(promise, messages),
  info: (message) => toast.info(message || 'Informação'),
  warning: (message) => toast.warning(message || 'Atenção'),
  dismiss: (toastId) => toast.dismiss(toastId),
  dismissAll: () => toast.dismiss(),
}

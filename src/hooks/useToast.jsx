import { Toaster, sileo } from 'sileo'
import { usePreferences } from '../context/PreferencesContext'

const toSileoOptions = (message, fallback) => ({
  title: typeof message === 'string' ? message : (fallback || 'Notificação'),
})

const resolvePromiseOption = (option, fallback) => {
  if (typeof option === 'function') {
    return (value) => {
      const resolved = option(value)
      if (typeof resolved === 'string') return { title: resolved }
      if (resolved && typeof resolved === 'object') return resolved
      return { title: fallback }
    }
  }

  if (typeof option === 'string') return { title: option }
  if (option && typeof option === 'object') return option
  return { title: fallback }
}

export const toast = {
  success: (message) => sileo.success(toSileoOptions(message, 'Operação realizada com sucesso!')),
  error: (message) => sileo.error(toSileoOptions(message, 'Ocorreu um erro!')),
  loading: (message) => sileo.show({ title: typeof message === 'string' ? message : 'Carregando...', type: 'loading', duration: null }),
  info: (message) => sileo.info(toSileoOptions(message, 'Informação')),
  warning: (message) => sileo.warning(toSileoOptions(message, 'Atenção')),
  dismiss: (toastId) => {
    if (toastId) {
      sileo.dismiss(toastId)
      return
    }
    sileo.clear()
  },
  promise: (promise, messages = {}) =>
    sileo.promise(promise, {
      loading: resolvePromiseOption(messages.loading, 'Carregando...'),
      success: resolvePromiseOption(messages.success, 'Operação concluída com sucesso!'),
      error: resolvePromiseOption(messages.error, 'Ocorreu um erro durante a operação.'),
    }),
}

export function ToastProvider() {
  const { theme } = usePreferences()

  return (
    <Toaster
      position="top-right"
      theme={theme === 'light' ? 'light' : 'dark'}
      options={{ duration: 3000 }}
    />
  )
}

export const toastMessages = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  loading: (message) => toast.loading(message),
  promise: (promise, messages) => toast.promise(promise, messages),
  info: (message) => toast.info(message),
  warning: (message) => toast.warning(message),
  dismiss: (toastId) => toast.dismiss(toastId),
  dismissAll: () => toast.dismiss(),
}

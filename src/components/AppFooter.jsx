import { APP_BUILD_LABEL } from '../constants/appMeta'
import { usePreferences } from '../context/PreferencesContext'

export function AppFooter({ className = '' }) {
  const { t, theme } = usePreferences()
  const isLight = theme === 'light'

  return (
    <footer className={`w-full text-center text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'} ${className}`.trim()}>
      <p>{t('versionLabel')}: {APP_BUILD_LABEL}</p>
    </footer>
  )
}

'use client'

import App from '../src/App'
import { FinanceProvider } from '../src/context/FinanceContext'
import { PreferencesProvider } from '../src/context/PreferencesContext'

export default function Page() {
  return (
    <PreferencesProvider>
      <FinanceProvider>
        <App />
      </FinanceProvider>
    </PreferencesProvider>
  )
}

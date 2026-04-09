import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const PreferencesContext = createContext(undefined)

const STORAGE_KEYS = {
  theme: 'mydindin_theme',
  language: 'mydindin_language',
  accent: 'mydindin_accent',
  density: 'mydindin_density',
}

const translations = {
  pt: {
    dashboard: 'Dashboard',
    stats: 'Estatísticas',
    categories: 'Categorias',
    reminders: 'Lembretes',
    ai: 'IA',
    user: 'Usuário',
    add: 'Adicionar',
    login: 'Entrar',
    signup: 'Criar conta',
    theme: 'Tema',
    language: 'Idioma',
    lightTheme: 'Claro',
    darkTheme: 'Escuro',
    interface: 'Interface',
    preferences: 'Preferências',
    signInTitle: 'MyDinDin',
    signInSubtitle: 'Entrar para acessar sua área financeira',
    appSubtitle: 'Gestão financeira para grupos e famílias',
    signUpTitle: 'Criar conta MyDinDin',
    signUpSubtitle: 'Cadastre-se para iniciar seu controle financeiro',
    setupGroupTitle: 'Configurar grupo',
    setupGroupSubtitle: 'Finalize a criação do seu espaço compartilhado',
    signInAction: 'Não tem conta? Cadastre-se',
    signUpAction: 'Já tem conta? Entrar',
    settings: 'Configurações',
    signOut: 'Sair da conta',
    themeToggle: 'Alternar tema',
    languagePt: 'Português',
    languageEn: 'Inglês',
    accentColor: 'Cor de destaque',
    density: 'Densidade',
    compact: 'Compacto',
    comfortable: 'Espaçoso',
    security: 'Segurança e integrações',
    profile: 'Perfil',
    group: 'Grupo',
    sharedBudgets: 'Orçamentos compartilhados do grupo',
    history: 'Histórico de alterações',
  },
  en: {
    dashboard: 'Dashboard',
    stats: 'Statistics',
    categories: 'Categories',
    reminders: 'Alerts',
    ai: 'AI',
    user: 'User',
    add: 'Add',
    login: 'Login',
    signup: 'Sign up',
    theme: 'Theme',
    language: 'Language',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    interface: 'Interface',
    preferences: 'Preferences',
    signInTitle: 'MyDinDin',
    signInSubtitle: 'Sign in to access your financial area',
    appSubtitle: 'Financial management for groups and families',
    signUpTitle: 'Create a MyDinDin account',
    signUpSubtitle: 'Sign up to start your financial control',
    setupGroupTitle: 'Set up group',
    setupGroupSubtitle: 'Finish creating your shared space',
    signInAction: 'No account yet? Sign up',
    signUpAction: 'Already have an account? Login',
    settings: 'Settings',
    signOut: 'Sign out',
    themeToggle: 'Toggle theme',
    languagePt: 'Portuguese',
    languageEn: 'English',
    accentColor: 'Accent color',
    density: 'Density',
    compact: 'Compact',
    comfortable: 'Comfortable',
    security: 'Security and integrations',
    profile: 'Profile',
    group: 'Group',
    sharedBudgets: 'Shared group budgets',
    history: 'Change history',
  },
}

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('pt')
  const [accent, setAccent] = useState('cyan')
  const [density, setDensity] = useState('comfortable')

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme)
    const storedLanguage = window.localStorage.getItem(STORAGE_KEYS.language)
    const storedAccent = window.localStorage.getItem(STORAGE_KEYS.accent)
    const storedDensity = window.localStorage.getItem(STORAGE_KEYS.density)
    if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)
    if (storedLanguage === 'en' || storedLanguage === 'pt') setLanguage(storedLanguage)
    if (storedAccent === 'cyan' || storedAccent === 'emerald' || storedAccent === 'amber') setAccent(storedAccent)
    if (storedDensity === 'compact' || storedDensity === 'comfortable') setDensity(storedDensity)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = language === 'en' ? 'en' : 'pt-BR'
    window.localStorage.setItem(STORAGE_KEYS.theme, theme)
    window.localStorage.setItem(STORAGE_KEYS.language, language)
    window.localStorage.setItem(STORAGE_KEYS.accent, accent)
    window.localStorage.setItem(STORAGE_KEYS.density, density)
  }, [accent, density, language, theme])

  useEffect(() => {
    document.documentElement.dataset.accent = accent
    document.documentElement.dataset.density = density
  }, [accent, density])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const t = useCallback(
    (key) => translations[language]?.[key] || translations.pt[key] || key,
    [language],
  )

  const value = useMemo(
    () => ({
      theme,
      language,
      accent,
      density,
      setTheme,
      setLanguage,
      setAccent,
      setDensity,
      toggleTheme,
      t,
    }),
    [accent, density, language, t, theme, toggleTheme],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences deve ser usado dentro de PreferencesProvider')
  }
  return context
}

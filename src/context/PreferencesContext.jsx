import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const PreferencesContext = createContext(undefined)

const STORAGE_KEYS = {
  theme: 'mydindin_theme',
  language: 'mydindin_language',
  accent: 'mydindin_accent',
  density: 'mydindin_density',
  layout: 'mydindin_layout',
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
    forgotPassword: 'Esqueci minha senha',
    settings: 'Configurações',
    signOut: 'Sair da conta',
    themeToggle: 'Alternar tema',
    languagePt: 'Português',
    languageEn: 'Inglês',
    accentColor: 'Cor de destaque',
    density: 'Densidade',
    layout: 'Layout',
    compact: 'Compacto',
    comfortable: 'Espaçoso',
    balancedLayout: 'Equilibrado',
    focusLayout: 'Foco',
    expandedLayout: 'Expandido',
    security: 'Segurança e integrações',
    profile: 'Perfil',
    group: 'Grupo',
    coupleTotal: 'Total do casal',
    groupNameLabel: 'Nome do grupo',
    groupNameHint: 'Use um nome simples para identificar o grupo compartilhado.',
    fullNameLabel: 'Seu nome completo',
    fullNameHint: 'Esse nome será exibido nas transações e histórico.',
    createGroup: 'Criar grupo',
    configuringGroup: 'Configurando...',
    loadingTitle: 'Carregando seu painel',
    loadingSubtitle: 'Sincronizando dados, preferências e alertas.',
    versionLabel: 'Versão',
    sharedBudgets: 'Orçamentos compartilhados do grupo',
    history: 'Histórico de alterações',
    chatTitle: 'Chat com DinDinMind',
    chatSubtitle: 'Converse com o DinDinMind sobre saldo, gastos, metas e previsão.',
    chatPlaceholder: 'Pergunte algo sobre suas finanças...',
    chatSend: 'Enviar',
    chatWelcome: 'Olá! Eu sou o DinDinMind. Vamos olhar seus números juntos e transformar isso em decisões mais leves no dia a dia.',
    chatTyping: 'DinDinMind está pensando no melhor conselho para você...',
    chatPromptSummary: 'Resumo do mês',
    chatPromptSpending: 'Onde gasto mais?',
    chatPromptBudget: 'Meu orçamento vai estourar?',
    chatPromptForecast: 'Prever gastos do mês',
    chatPromptSeasonality: 'Analisar sazonalidade',
    chatYou: 'Você',
    chatAssistant: 'DinDinMind',
    chatModelTag: 'DinDinMind • motor local com classificação de intenções',
    chatIntentTag: 'Lê seu histórico e identifica padrões',
    chatClear: 'Limpar conversa',
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
    forgotPassword: 'Forgot password',
    settings: 'Settings',
    signOut: 'Sign out',
    themeToggle: 'Toggle theme',
    languagePt: 'Portuguese',
    languageEn: 'English',
    accentColor: 'Accent color',
    density: 'Density',
    layout: 'Layout',
    compact: 'Compact',
    comfortable: 'Comfortable',
    balancedLayout: 'Balanced',
    focusLayout: 'Focus',
    expandedLayout: 'Expanded',
    security: 'Security and integrations',
    profile: 'Profile',
    group: 'Group',
    coupleTotal: 'Couple total',
    groupNameLabel: 'Group name',
    groupNameHint: 'Use a short name to identify your shared group.',
    fullNameLabel: 'Your full name',
    fullNameHint: 'This name appears on transactions and activity history.',
    createGroup: 'Create group',
    configuringGroup: 'Configuring...',
    loadingTitle: 'Loading your dashboard',
    loadingSubtitle: 'Syncing data, preferences, and alerts.',
    versionLabel: 'Version',
    sharedBudgets: 'Shared group budgets',
    history: 'Change history',
    chatTitle: 'DinDinMind chat',
    chatSubtitle: 'Talk with DinDinMind about balance, spending, goals, and forecasts.',
    chatPlaceholder: 'Ask something about your finances...',
    chatSend: 'Send',
    chatWelcome: 'Hi! I am DinDinMind. Let us review your numbers together and turn them into practical next steps.',
    chatTyping: 'DinDinMind is preparing a thoughtful answer for you...',
    chatPromptSummary: 'Monthly summary',
    chatPromptSpending: 'Where do I spend the most?',
    chatPromptBudget: 'Will my budget overflow?',
    chatPromptForecast: 'Forecast this month',
    chatPromptSeasonality: 'Analyze seasonality',
    chatYou: 'You',
    chatAssistant: 'DinDinMind',
    chatModelTag: 'DinDinMind • local intent-classification engine',
    chatIntentTag: 'Reads your history and detects patterns',
    chatClear: 'Clear chat',
  },
}

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('pt')
  const [accent, setAccent] = useState('cyan')
  const [density, setDensity] = useState('comfortable')
  const [layoutMode, setLayoutMode] = useState('balanced')

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme)
    const storedLanguage = window.localStorage.getItem(STORAGE_KEYS.language)
    const storedAccent = window.localStorage.getItem(STORAGE_KEYS.accent)
    const storedDensity = window.localStorage.getItem(STORAGE_KEYS.density)
    const storedLayout = window.localStorage.getItem(STORAGE_KEYS.layout)
    if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)
    if (storedLanguage === 'en' || storedLanguage === 'pt') setLanguage(storedLanguage)
    if (storedAccent === 'cyan' || storedAccent === 'emerald' || storedAccent === 'amber') setAccent(storedAccent)
    if (storedDensity === 'compact' || storedDensity === 'comfortable') setDensity(storedDensity)
    if (storedLayout === 'balanced' || storedLayout === 'focus' || storedLayout === 'expanded') setLayoutMode(storedLayout)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = language === 'en' ? 'en' : 'pt-BR'
    document.documentElement.dataset.accent = accent
    document.documentElement.dataset.density = density
    document.documentElement.dataset.layout = layoutMode
    window.localStorage.setItem(STORAGE_KEYS.theme, theme)
    window.localStorage.setItem(STORAGE_KEYS.language, language)
    window.localStorage.setItem(STORAGE_KEYS.accent, accent)
    window.localStorage.setItem(STORAGE_KEYS.density, density)
    window.localStorage.setItem(STORAGE_KEYS.layout, layoutMode)
  }, [accent, density, language, layoutMode, theme])

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
      layoutMode,
      setTheme,
      setLanguage,
      setAccent,
      setDensity,
      setLayoutMode,
      toggleTheme,
      t,
    }),
    [accent, density, layoutMode, language, t, theme, toggleTheme],
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

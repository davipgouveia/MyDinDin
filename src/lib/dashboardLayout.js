// Layout personalizável do painel (dashboard): ordem e largura dos painéis.
// Persistido no navegador (localStorage). A mescla com o padrão garante que
// painéis novos apareçam automaticamente em layouts salvos antigos.

export const DASHBOARD_PANEL_LABELS = {
  quick: 'Lançamento rápido',
  weekly: 'Sua semana',
  pending: 'Classificar pendentes',
  import: 'Ficar em dia',
  summary: 'Cartões de resumo',
  categories: 'Categorias',
  latest: 'Últimas transações',
}

export const DEFAULT_DASHBOARD_LAYOUT = {
  order: ['quick', 'weekly', 'pending', 'import', 'summary', 'categories', 'latest'],
  spans: { quick: 12, weekly: 12, pending: 12, import: 12, summary: 12, categories: 7, latest: 5 },
}

// Larguras possíveis, em colunas de uma grade de 12.
export const SPAN_STEPS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const STORAGE_KEY = 'mydindin:dashboard-layout:v1'

export function spanPercent(span) {
  return Math.round((span / 12) * 100)
}

export function sanitizeDashboardLayout(raw) {
  const known = DEFAULT_DASHBOARD_LAYOUT.order
  if (!raw || typeof raw !== 'object') return DEFAULT_DASHBOARD_LAYOUT
  const savedOrder = Array.isArray(raw.order) ? raw.order.filter((id) => known.includes(id)) : []
  const order = [...savedOrder, ...known.filter((id) => !savedOrder.includes(id))]
  const spans = { ...DEFAULT_DASHBOARD_LAYOUT.spans }
  if (raw.spans && typeof raw.spans === 'object') {
    for (const id of known) {
      if (SPAN_STEPS.includes(raw.spans[id])) spans[id] = raw.spans[id]
    }
  }
  return { order, spans }
}

export function loadDashboardLayout() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return sanitizeDashboardLayout(parsed)
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT
  }
}

export function saveDashboardLayout(layout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // Sem localStorage, o layout só vale para a sessão.
  }
}

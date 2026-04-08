export const EXPENSE_CATEGORIES = [
  {
    id: 'alimentacao',
    name: 'Alimentação',
    icon: '🍔',
    color: '#f97316',
    description: 'Comida, restaurantes e supermercado',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    icon: '🚗',
    color: '#06b6d4',
    description: 'Gasolina, uber, táxi e transportes',
  },
  {
    id: 'saude',
    name: 'Saúde',
    icon: '🏥',
    color: '#ef4444',
    description: 'Medicamentos, consultas e cuidados',
  },
  {
    id: 'educacao',
    name: 'Educação',
    icon: '📚',
    color: '#8b5cf6',
    description: 'Cursos, livros e educação',
  },
  {
    id: 'lazer',
    name: 'Lazer',
    icon: '🎮',
    color: '#ec4899',
    description: 'Diversão, filmes e entretenimento',
  },
  {
    id: 'contas',
    name: 'Contas & Serviços',
    icon: '💳',
    color: '#22c55e',
    description: 'Contas de luz, internet, água',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: '#eab308',
    description: 'Roupas e compras pessoais',
  },
  {
    id: 'outros',
    name: 'Outros',
    icon: '📌',
    color: '#64748b',
    description: 'Outras despesas',
  },
]

export const INCOME_CATEGORIES = [
  {
    id: 'salario',
    name: 'Salário',
    icon: '💰',
    color: '#22c55e',
    description: 'Renda do trabalho',
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: '💻',
    color: '#06b6d4',
    description: 'Renda de trabalhos freelance',
  },
  {
    id: 'investimentos',
    name: 'Investimentos',
    icon: '📈',
    color: '#84cc16',
    description: 'Retorno de investimentos',
  },
  {
    id: 'presente',
    name: 'Presente',
    icon: '🎁',
    color: '#f97316',
    description: 'Presentes recebidos',
  },
  {
    id: 'outros_rendimentos',
    name: 'Outros Rendimentos',
    icon: '💵',
    color: '#64748b',
    description: 'Outras fontes de renda',
  },
]

export const PAYMENT_METHODS = [
  { id: 'dinheiro', name: 'Dinheiro', icon: '💵' },
  { id: 'credito', name: 'Cartão de Crédito', icon: '💳' },
  { id: 'debito', name: 'Cartão de Débito', icon: '🏦' },
  { id: 'pix', name: 'PIX', icon: '📱' },
  { id: 'transferencia', name: 'Transferência', icon: '💸' },
]

export const FREQUENCY_OPTIONS = [
  { id: 'unica', name: 'Única Vez' },
  { id: 'diaria', name: 'Diária' },
  { id: 'semanal', name: 'Semanal' },
  { id: 'quinzenal', name: 'Quinzenal' },
  { id: 'mensal', name: 'Mensal' },
  { id: 'trimestral', name: 'Trimestral' },
  { id: 'semestral', name: 'Semestral' },
  { id: 'anual', name: 'Anual' },
]

export const getCategoryById = (id, type = 'expense') => {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return categories.find((cat) => cat.id === id)
}

export const getPaymentMethodById = (id) => {
  return PAYMENT_METHODS.find((method) => method.id === id)
}

# FinançasAPP - Guia de Novos Recursos

## 📌 Visão Geral

Este documento descreve todos os novos recursos implementados na versão 2.0 do FinançasAPP.

---

## 🎨 1. Logo Profissional com Animações

### Localização
- **Arquivo**: `src/components/Logo.jsx`
- **Descrição**: Componente de logo animado com escudo estilizado e gráfico de crescimento

### Características
- ✨ Animações fluidas com Framer Motion
- 🎯 Escudo com linhas interconectadas simbolizando segurança
- 📊 Gráfico de barras com seta de crescimento
- 🎨 Tons de azul transmitindo confiança
- 📱 Responsivo e otimizado para PWA

### Uso
```jsx
import Logo from '@/components/Logo'

// Com animação (padrão)
<Logo size="medium" />

// Sem animação
<Logo animated={false} />

// Tamanhos disponíveis: small, medium, large
```

---

## 💼 2. Sistema de Categorias Avançado

### Localização
- **Arquivo**: `src/constants/categories.js`
- **Componente**: `src/components/CategoriesManager.jsx`
- **Contexto**: `src/context/TransactionCategoryContext.jsx`

### Categorias Pré-definidas

#### Despesas
- 🍔 Alimentação
- 🚗 Transporte
- 🏥 Saúde
- 📚 Educação
- 🎮 Lazer
- 💳 Contas & Serviços
- 🛍️ Shopping
- 📌 Outros

#### Rendas
- 💰 Salário
- 💻 Freelance
- 📈 Investimentos
- 🎁 Presente
- 💵 Outros Rendimentos

### Funcionalidades
- ✅ Criar categorias customizadas
- ✅ Reordenar categorias (drag & drop)
- ✅ Salvar preferências localmente
- ✅ Ícones e cores personalizáveis

### Uso do Contexto
```jsx
import { useTransactionCategory } from '@/context/TransactionCategoryContext'

function Component() {
  const {
    getAllCategories,
    getOrderedCategories,
    addCustomCategory,
    saveCategoryOrder,
  } = useTransactionCategory()

  const categories = getOrderedCategories('expense')
}
```

---

## 📊 3. Estatísticas Diárias e Mensais

### Localização
- **Arquivo**: `src/hooks/useStats.js`
- **Componentes**: `src/components/StatsCards.jsx`

### Dados Fornecidos
- 💰 Gastos diários totais
- 💵 Rendas diárias totais
- 📈 Saldo do dia
- 📅 Resumo mensal
- 📊 Maiores categorias de gasto
- 📉 Média diária de gastos

### Hooks Disponíveis

#### `useDailyMonthlyStats()`
```jsx
const {
  dailyExpenses,      // Array com gastos dos últimos 30 dias
  dailyIncomes,       // Array com rendas dos últimos 30 dias
  monthlyByCategory,  // Objeto com gastos por categoria
  totalDailyExpenses,
  totalDailyIncomes,
  avgDailyExpense,
  largestExpenseCategory,
} = useDailyMonthlyStats()
```

#### `useCategoryStats()`
```jsx
const stats = useCategoryStats()
// Retorna: { [category]: { total, count, percentage, transactions } }
```

---

## 🔔 4. Lembretes de Pagamento

### Localização
- **Arquivo**: `src/context/TransactionCategoryContext.jsx`
- **Componente**: `src/components/RemindersSection.jsx`

### Funcionalidades
- 🔔 Criar lembretes de pagamento
- ⏰ Sistema de urgência (crítico, aviso, normal)
- 📱 Notificações visuais
- ☑️ Marcar como concluído
- 🗑️ Deletar lembretes

### Métodos Disponíveis
```jsx
const {
  paymentReminders,
  addPaymentReminder,
  removePaymentReminder,
  updatePaymentReminder,
  getUpcomingReminders,  // Lembretes dos próximos N dias
} = useTransactionCategory()

// Adicionar lembrete
addPaymentReminder({
  description: 'Pagamento da conta de luz',
  dueDate: '2026-04-15',
  amount: 150.00,
})

// Obter lembretes próximos (7 dias)
const upcoming = getUpcomingReminders(7)
```

---

## 🔄 5. Pagamentos Recorrentes

### Localização
- **Arquivo**: `src/context/TransactionCategoryContext.jsx`
- **Componente**: `src/components/RemindersSection.jsx`

### Funcionalidades
- 📅 Automatizar pagamentos recorrentes
- 🔁 Frequências: Diária, Semanal, Quinzenal, Mensal, Trimestral, Semestral, Anual
- 📆 Data de encerramento opcional
- 📊 Gerar próximas datas automaticamente

### Tipos de Frequência
```javascript
'diaria'      // Diária
'semanal'     // Semanal
'quinzenal'   // Quinzenal
'mensal'      // Mensal
'trimestral'  // Trimestral
'semestral'   // Semestral
'anual'       // Anual
'unica'       // Única vez
```

### Exemplo de Uso
```jsx
const { addRecurringPayment, getNextRecurringDates } = useTransactionCategory()

const payment = addRecurringPayment({
  name: 'Aluguel',
  amount: 1500.00,
  startDate: '2026-04-01',
  frequency: 'mensal',
  endDate: '2027-12-31',
})

// Gerar próximas 3 datas
const nextDates = getNextRecurringDates(payment, 3)
```

---

## 🔀 6. Ordenação Personalizada de Listas

### Localização
- **Componente**: `src/components/CategoriesManager.jsx`

### Funcionalidades
- 🎯 Drag & drop para reordenar categorias
- 💾 Salvar preferências de ordenação
- 📱 Persistência com localStorage
- ⌨️ Modo edição intuitivo

### Exemplo
```jsx
const { saveCategoryOrder, getOrderedCategories } = useTransactionCategory()

// Salvar nova ordem
saveCategoryOrder(['alimentacao', 'transporte', 'saude', ...])

// Obter categorias na ordem customizada
const ordered = getOrderedCategories('expense')
```

---

## 🤖 7. IA para Recomendações Financeiras

### Localização
- **Arquivo**: `src/hooks/useFinancialAI.js`
- **Componente**: `src/components/AIRecommendations.jsx`

### Hook: `useFinancialAI()`

#### Insights Fornecidos
```jsx
const {
  recommendations,           // Array de recomendações
  insights,                  // Análise detalhada
  generateInsights,          // Função para gerar insights manuais
  dismissRecommendation,     // Descartar recomendação
  getActionableRecommendations, // Recomendações críticas
} = useFinancialAI()

const {
  totalIncome,              // Renda total do mês
  totalExpenses,            // Gastos totais
  balance,                  // Saldo (renda - gastos)
  savingsRate,              // Taxa de poupança (%)
  categoryExpenses,         // Gastos por categoria
  largestExpenseCategory,   // Categoria com maior gasto
} = insights
```

#### Tipos de Recomendações

1. **Categoria com Alto Gasto** (⚠️ Warning)
   - Identifica quando uma categoria representa >30% dos gastos
   - Sugere redução ou revisão

2. **Taxa de Poupança Baixa** (🔴 Critical)
   - Quando poup < 10%
   - Recomenda aumentar para 20%

3. **Excelente Taxa de Poupança** (✅ Success)
   - Quando poup >= 20%
   - Parabéns e incentivo

4. **Picos de Gasto** (ℹ️ Info)
   - Detecta variações maiores que 150% da média
   - Sugere investigar causas

5. **Déficit Financeiro** (❌ Critical)
   - Quando gastos > renda
   - Urgência máxima

6. **Meta de Poupança** (✅ Success)
   - Sugere meta de 30% da renda

---

## 🎯 8. Sistema de Orçamentos com Alertas

### Localização
- **Arquivo**: `src/hooks/useFinancialAI.js`
- **Componente**: `src/components/AIRecommendations.jsx`

### Hook: `useFinancialBudget()`

```jsx
const {
  budgets,           // Array de orçamentos
  addBudget,         // Criar novo orçamento
  removeBudget,      // Remover orçamento
  getBudgetStatus,   // Status de cada orçamento
} = useFinancialBudget()

// Criar orçamento
addBudget('alimentacao', 500, 'mensal')

// Status do orçamento
// status: 'ok' | 'warning' (>80%) | 'exceeded'
```

---

## 🎬 9. Animações Fluidas com Framer Motion

### Localização
- **Toda a aplicação** - Integrado em todos os componentes

### Tipos de Animações
- ✨ Entrada de componentes (slide, fade, scale)
- 🎯 Transições suaves entre estados
- 🖱️ Interações com hover e tap
- 📱 Drag & drop para reordenação
- 🔄 Animações de processamento

### Exemplos
```jsx
import { motion } from 'framer-motion'

// Componente com animação
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Conteúdo animado
</motion.div>

// Com hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Clique aqui
</motion.button>

// Drag & drop
<Reorder.Group values={items} onReorder={setItems}>
  {items.map(item => (
    <Reorder.Item key={item.id} value={item}>
      {item.name}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

---

## 🔔 10. Sistema de Toasts/Notificações

### Localização
- **Arquivo**: `src/hooks/useToast.jsx`

### Bibliotecas Utilizadas
- **Sonner** - Toast moderno e responsivo
- **React Toastify** - Alternativa adicional

### Uso
```jsx
import { toast, ToastProvider } from '@/hooks/useToast'

// No App.jsx
<ToastProvider />

// Usar em qualquer componente
toast.success('Operação realizada!')
toast.error('Ocorreu um erro!')
toast.loading('Carregando...')
toast.warning('Atenção!')
toast.info('Informação')
toast.dismiss()
toast.dismissAll()

// Com promise
toast.promise(
  fetchData(),
  {
    loading: 'Carregando...',
    success: 'Dados carregados!',
    error: 'Erro ao carregar',
  }
)
```

---

## 🛠️ Guia de Implementação

### Passo 1: Instalar Dependências
```bash
npm install framer-motion sonner react-toastify zustand date-fns
```

### Passo 2: Adicionar Providers
```jsx
// App.jsx
import { TransactionCategoryProvider } from '@/context/TransactionCategoryContext'
import { ToastProvider } from '@/hooks/useToast'

export default function App() {
  return (
    <TransactionCategoryProvider>
      <ToastProvider />
      {/* Seu app aqui */}
    </TransactionCategoryProvider>
  )
}
```

### Passo 3: Usar Componentes
```jsx
import { Logo } from '@/components/Logo'
import { DailyStatsCard, MonthlyStatsCard } from '@/components/StatsCards'
import { PaymentRemindersSection, RecurringPaymentsSection } from '@/components/RemindersSection'
import { CategoriesManager } from '@/components/CategoriesManager'
import { AIRecommendationsPanel, BudgetAlertPanel } from '@/components/AIRecommendations'
import { AdvancedTransactionModal } from '@/components/AdvancedTransactionModal'

function Page() {
  return (
    <>
      <Logo size="medium" />
      <DailyStatsCard />
      <MonthlyStatsCard />
      <PaymentRemindersSection />
      <RecurringPaymentsSection />
      <CategoriesManager />
      <AIRecommendationsPanel />
      <BudgetAlertPanel />
    </>
  )
}
```

---

## 📱 Estrutura de Pastas

```
src/
├── components/
│   ├── Logo.jsx                    # Logo animado
│   ├── StatsCards.jsx              # Cards de estatísticas
│   ├── RemindersSection.jsx        # Lembretes e recorrentes
│   ├── CategoriesManager.jsx       # Gerenciador de categorias
│   ├── AIRecommendations.jsx       # Recomendações da IA
│   └── AdvancedTransactionModal.jsx # Modal avançado
├── context/
│   ├── FinanceContext.jsx          # Contexto original
│   └── TransactionCategoryContext.jsx # Novo contexto
├── hooks/
│   ├── useStats.js                 # Hooks de estatísticas
│   ├── useFinancialAI.js           # Hooks de IA
│   └── useToast.jsx                # Hooks de notificações
├── constants/
│   └── categories.js               # Constantes de categorias
└── index.css                       # Estilos globais com animações
```

---

## 🎨 Paleta de Cores

- **Primário**: Cyan (#06b6d4)
- **Secundário**: Blue (#0369a1)
- **Sucesso**: Green (#22c55e)
- **Aviso**: Yellow (#eab308)
- **Perigo**: Red (#ef4444)
- **Roxo**: Purple (#8b5cf6)
- **Fundo**: Slate-950 (#020617)

---

## ⚡ Performance

- ✅ Animações otimizadas com GPU
- ✅ Lazy loading de componentes
- ✅ Memoization de contextos
- ✅ localStorage para persistência
- ✅ Respeita preferências de movimento reduzido

---

## 🔐 Segurança

- ✅ Dados armazenados localmente (localStorage)
- ✅ Validação de formulários
- ✅ Sanitização de inputs
- ✅ Protected routes

---

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato!

---

**Última atualização**: Abril de 2026
**Versão**: 2.0

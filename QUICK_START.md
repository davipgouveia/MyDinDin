# 🚀 Guia de Setup Rápido - FinançasAPP v2.0

## ⚡ Instalação (5 minutos)

### 1️⃣ Dependências Já Instaladas
```bash
npm install framer-motion sonner react-toastify zustand date-fns
```

### 2️⃣ Adicionar o ToastProvider no App.jsx
```jsx
import { ToastProvider } from '@/hooks/useToast'

export default function App() {
  return (
    <>
      <ToastProvider />
      {/* seu app */}
    </>
  )
}
```

### 3️⃣ Adicionar Provider de Categorias
```jsx
import { TransactionCategoryProvider } from '@/context/TransactionCategoryContext'

export default function App() {
  return (
    <TransactionCategoryProvider>
      <ToastProvider />
      {/* seu app */}
    </TransactionCategoryProvider>
  )
}
```

## 📚 Como Usar (Exemplos Rápidos)

### Logo Animado
```jsx
import Logo from '@/components/Logo'

<Logo size="medium" animated={true} />
```

### Dashboard de Estatísticas
```jsx
import { DailyStatsCard, MonthlyStatsCard } from '@/components/StatsCards'
import { useDailyMonthlyStats } from '@/hooks/useStats'

function Dashboard() {
  const stats = useDailyMonthlyStats()
  
  return (
    <>
      <DailyStatsCard />
      <MonthlyStatsCard />
    </>
  )
}
```

### Gerenciador de Categorias
```jsx
import { CategoriesManager } from '@/components/CategoriesManager'
import { useTransactionCategory } from '@/context/TransactionCategoryContext'

function Categories() {
  const { getOrderedCategories, saveCategoryOrder, addCustomCategory } = useTransactionCategory()
  
  return (
    <CategoriesManager
      categories={getOrderedCategories('expense')}
      onReorder={saveCategoryOrder}
      onAddCustom={addCustomCategory}
    />
  )
}
```

### Lembretes de Pagamento
```jsx
import { PaymentRemindersSection } from '@/components/RemindersSection'
import { useTransactionCategory } from '@/context/TransactionCategoryContext'

function Reminders() {
  const { paymentReminders, removePaymentReminder } = useTransactionCategory()
  
  return (
    <PaymentRemindersSection
      reminders={paymentReminders}
      onDelete={removePaymentReminder}
    />
  )
}
```

### Pagamentos Recorrentes
```jsx
import { RecurringPaymentsSection } from '@/components/RemindersSection'
import { useTransactionCategory } from '@/context/TransactionCategoryContext'

function RecurringPayments() {
  const { recurringPayments, removeRecurringPayment } = useTransactionCategory()
  
  return (
    <RecurringPaymentsSection
      payments={recurringPayments}
      onDelete={removeRecurringPayment}
    />
  )
}
```

### Recomendações da IA
```jsx
import { AIRecommendationsPanel } from '@/components/AIRecommendations'
import { useFinancialAI } from '@/hooks/useFinancialAI'

function AIPanel() {
  const { recommendations, dismissRecommendation } = useFinancialAI()
  
  return (
    <AIRecommendationsPanel
      recommendations={recommendations}
      onDismiss={dismissRecommendation}
    />
  )
}
```

### Sistema de Orçamentos
```jsx
import { BudgetAlertPanel } from '@/components/AIRecommendations'
import { useFinancialBudget } from '@/hooks/useFinancialAI'

function BudgetPanel() {
  const { getBudgetStatus } = useFinancialBudget()
  
  return <BudgetAlertPanel budgets={getBudgetStatus} />
}
```

### Modal Avançado de Transações
```jsx
import { AdvancedTransactionModal } from '@/components/AdvancedTransactionModal'
import { useState } from 'react'

function TransactionForm() {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSubmit = (formData) => {
    console.log('Nova transação:', formData)
  }
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Nova Transação</button>
      <AdvancedTransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        transactionType="expense"
      />
    </>
  )
}
```

### Toasts/Notificações
```jsx
import { toast } from '@/hooks/useToast'

// Sucesso
toast.success('Operação realizada!')

// Erro
toast.error('Algo deu errado')

// Loading
const id = toast.loading('Processando...')
setTimeout(() => toast.dismiss(id), 3000)

// Promise
toast.promise(
  fetch('/api/data'),
  {
    loading: 'Carregando...',
    success: 'Carregado com sucesso!',
    error: 'Erro ao carregar',
  }
)
```

## 🎯 Exemplo Completo

Veja `src/examples/CompleteIntegrationExample.jsx` para um exemplo completo de como integrar todos os componentes em uma página.

## 🔍 Checklist de Funcionalidades

- ✅ Logo com animações
- ✅ Estatísticas diárias/mensais
- ✅ Categorias customizáveis
- ✅ Lembretes de pagamento
- ✅ Pagamentos recorrentes
- ✅ Reordenação de categorias
- ✅ Recomendações da IA
- ✅ Sistema de orçamentos
- ✅ Animações fluidas
- ✅ Toasts/Notificações

## 📚 Documentação Completa

- [NOVOS_RECURSOS.md](./NOVOS_RECURSOS.md) - Documentação detalhada
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) - Progress e próximos passos
- [src/examples/CompleteIntegrationExample.jsx](./src/examples/CompleteIntegrationExample.jsx) - Exemplo prático

## 🆘 Troubleshooting

### Erro: "categorias não está definido"
```jsx
// ✅ Correto - Importar do contexto
import { useTransactionCategory } from '@/context/TransactionCategoryContext'
const { getAllCategories } = useTransactionCategory()

// ❌ Incorreto - Importar diretamente
import { EXPENSE_CATEGORIES } from '@/constants/categories'
```

### Erro: "Toast não aparece"
```jsx
// ✅ Correto - Adicionar ToastProvider
import { ToastProvider } from '@/hooks/useToast'

export default function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  )
}
```

### Erro: "Contexto não encontrado"
```jsx
// ✅ Correto - Wrapping com Provider
import { TransactionCategoryProvider } from '@/context/TransactionCategoryContext'

export default function App() {
  return (
    <TransactionCategoryProvider>
      <YourApp />
    </TransactionCategoryProvider>
  )
}
```

## 🚀 Deploy

Tudo está pronto para produção! Basta fazer:

```bash
npm run build
npm run preview
```

## 📞 Precisa de Ajuda?

1. Consulte a documentação em `NOVOS_RECURSOS.md`
2. Veja o exemplo em `CompleteIntegrationExample.jsx`
3. Estude os comentários no código dos componentes
4. Verifique o `IMPLEMENTATION_CHECKLIST.md`

---

**Você está pronto para usar o FinançasAPP v2.0! 🎉**

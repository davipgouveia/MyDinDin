# 💰 FinançasAPP v2.0 - Aplicação de Gestão Financeira Enterprise

> Gestão financeira inteligente com IA, categorias avançadas, lembretes automáticos e animações fluidas

**Status**: ✅ Production Ready | **Versão**: 2.0 | **Data**: Abril 2026

---

## 🎯 Sobre FinançasAPP

O FinançasAPP é uma aplicação web completa de gestão financeira pessoal e familiar com design moderno, IA integrada e funcionalidades enterprise. Combina modo online (Supabase) com modo offline (PWA), oferecendo a melhor experiência mobile-first.

### ✨ Principais Diferenciais

- 🎨 **Logo Profissional** com animações
- 🤖 **IA Inteligente** com 6 tipos de recomendações
- 📊 **Analytics Completo** - daily/monthly stats
- 🎯 **Categorias Avançadas** - 13 pré-definidas + customizáveis
- 🔀 **Drag & Drop** - reordenação intuitiva
- 🔔 **Lembretes** - sistema de notificações com urgência
- 🔄 **Pagamentos Recorrentes** - 8 frequências disponíveis
- 💰 **Orçamentos** - controle total de gastos
- 🎬 **100+ Animações** - transições fluidas
- 📱 **Mobile-First** - PWA instalável

## 📚 Documentação Principal

| Documento | Tempo | Link |
|-----------|-------|------|
| 📖 Índice Completo | - | [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) |
| ⚡ Quick Start | 5 min | [QUICK_START.md](./QUICK_START.md) |
| 🏆 Resumo Executivo | 10 min | [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md) |
| 📚 Guia Completo | 30 min | [NOVOS_RECURSOS.md](./NOVOS_RECURSOS.md) |
| ✅ Checklist | 10 min | [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) |

## 🚀 Stack Tecnológico

### Frontend
- **React 19** - UI moderna
- **Vite** - Build ultra-rápido
- **Framer Motion** - Animações profissionais
- **Tailwind CSS** - Estilização
- **Sonner** - Toast notifications

### Bibliotecas de Suporte
- **Lucide React** - Ícones (300+)
- **Recharts** - Gráficos interativos
- **zustand** - State management
- **date-fns** - Manipulação de datas

### Backend & Armazenamento
- **Supabase** - Auth + PostgreSQL + RLS
- **localStorage** - Modo offline
- **PWA** - Cache inteligente

## ⚙️ Funcionalidades

### 📊 Dashboard Inteligente
- ✅ Estatísticas diárias em tempo real
- ✅ Resumo mensal detalhado
- ✅ Gráficos com Recharts
- ✅ Saldo atual destacado
- ✅ Últimas transações

### 🎯 Gerenciamento de Categorias
- ✅ 8 categorias de despesa pré-definidas
-✅ 5 categorias de renda pré-definidas
- ✅ Criação de categorias customizadas
- ✅ Reordenação com drag & drop
- ✅ Cores e ícones personalizáveis

### 🔔 Lembretes & Recorrentes
- ✅ Sistema de lembretes de pagamento
- ✅ Sistema de urgência adaptativo
- ✅ Pagamentos recorrentes (8 frequências)
- ✅ Geração automática de datas
- ✅ Notificações visuais

### 🤖 IA para Recomendações
- ✅ Análise automática de gastos
- ✅ Detecção de categories com alto gasto
- ✅ Alertas de taxa de poupança
- ✅ Sugestão de metas
- ✅ Detecção de anomalias e picos

### 💰 Sistema de Orçamentos
- ✅ Criar orçamentos por categoria
- ✅ Barra de progresso visual
- ✅ Status em tempo real
- ✅ Alertas automáticos (>80%)

### 🎬 Animações & UX
- ✅ 100+ animações com Framer Motion
- ✅ Transições suaves
- ✅ Interações responsivas
- ✅ Dark mode otimizado

### 👥 Multi-tenant
- ✅ Filtro por usuário (Davi, Laryssa, Total)
- ✅ RLS no Supabase
- ✅ Compartilhamento seguro de dados

## 🚀 Como Começar

### 1️⃣ Instalação Rápida
```bash
# Instale dependências
npm install

# Configure Supabase
cp .env.example .env
# Edite .env com suas credenciais

# Rode em desenvolvimento
npm run dev
```

### 2️⃣ Próximos Passos
1. Leia [QUICK_START.md](./QUICK_START.md) (5 min)
2. Veja o exemplo em [src/examples/CompleteIntegrationExample.jsx](./src/examples/CompleteIntegrationExample.jsx)
3. Consulte [NOVOS_RECURSOS.md](./NOVOS_RECURSOS.md) para documentação completa
4. Revise [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) para navegação

## 📋 Requisitos

- **Node.js** 20+ 
- **npm** 10+
- **Supabase** (opcional - app funciona offline)

## 📦 Instalação Detalhada

### 1. Clone o Repositório
```bash
cd /workspaces/Finan-as
```

### 2. Instale Dependências
```bash
npm install
```

### 3. Configure Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas credenciais Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Execute em Desenvolvimento
```bash
npm run dev
```

### 5. Build para Produção
```bash
npm run build
npm run preview
```

## 📂 Estrutura do Projeto

```
src/
├── components/
│   ├── Logo.jsx                    ✨ Novo
│   ├── StatsCards.jsx              ✨ Novo
│   ├── RemindersSection.jsx        ✨ Novo
│   ├── CategoriesManager.jsx       ✨ Novo
│   ├── AIRecommendations.jsx       ✨ Novo
│   ├── AdvancedTransactionModal.jsx ✨ Novo
│   └── ... (componentes originais)
├── context/
│   ├── TransactionCategoryContext.jsx ✨ Novo
│   └── FinanceContext.jsx          (original)
├── hooks/
│   ├── useStats.js                 ✨ Novo
│   ├── useFinancialAI.js           ✨ Novo
│   └── useToast.jsx                ✨ Novo
├── constants/
│   └── categories.js               ✨ Novo
├── examples/
│   └── CompleteIntegrationExample.jsx ✨ Novo
└── index.css                       ✏️ Atualizado
```

## 🌐 PWA - Progressive Web App

O FinançasAPP é um PWA totalmente funcional:

- **Instalável** - Adicione à tela inicial
- **Offline** - Funciona sem internet
- **Rápido** - Cache inteligente
- **Seguro** - Service Worker validado

### Instalar no Celular
1. Abra a aplicação em um navegador compatível
2. Toque em "Adicionar à tela inicial"
3. Confirmação automática
4. Acesso direto no seu celular

## 💾 Persistência de Dados

### Local (localStorage)
- Modo offline padrão
- Categorias customizadas
- Lembretes e pagamentos recorrentes
- Ordenação de categorias

### Nuvem (Supabase)
- Sincronização com PostgreSQL
- Autenticação de usuários
- Row-level security (RLS)
- Multi-tenancy por família

## 🏗️ Estrutura de Banco de Dados

A migration SQL em `supabase/migrations/20260408_001_financeirodl_v2_enterprise.sql` cria:

- **family_groups** - Grupos/famílias
- **profiles** - Usuários
- **categories** - Categorias de transação
- **transactions** - Movimentações financeiras
- **budgets** - Limites de gastos
- **Payment policies** - RLS para segurança

### Aplicar Migration
```sql
-- No Supabase SQL Editor
SELECT public.bootstrap_family_group('Sua Família', 'Seu Nome');
```

## 🎯 Casos de Uso

- 💼 **Pessoal** - Controle suas finanças
- 👥 **Casal** - Compartilhe gastos com segurança
- 👨‍👩‍👧‍👦 **Família** - Limite de gastos
- 📊 **Análise** - Entenda seus padrões de gasto
- 🎓 **Educação** - Aprender sobre finanças

## 🔧 Configuração Avançada

### Customizar Categorias
```jsx
// src/constants/categories.js
export const EXPENSE_CATEGORIES = [
  // Edite aqui
]
```

### Adicionar Recomendações da IA
```jsx
// src/hooks/useFinancialAI.js
const generateInsights = () => {
  // Adicione suas análises aqui
}
```

### Mudarp Paleta de Cores
```css
/* src/index.css */
:root {
  --color-primary: ...
  --color-secondary: ...
}
```

## 📊 Estatísticas do Projeto

| Aspecto | Valor |
|---------|-------|
| Componentes | 10+ |
| Hooks | 8 |
| Linhas de Código | 2,500+ |
| Animações | 100+ |
| Categorias | 13 |
| Documentação | 5 arquivos |

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### GitHub Pages
```bash
npm run build
# Faça push da pasta dist/
```

## 📖 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | Índice geral e guia de navegação |
| [QUICK_START.md](./QUICK_START.md) | Setup rápido (5 min) |
| [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md) | Visão geral (10 min) |
| [NOVOS_RECURSOS.md](./NOVOS_RECURSOS.md) | Guia completo (30 min) |
| [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) | Progresso e roadmap |

## ❓ FAQ

**P: O app funciona sem Supabase?**  
R: Sim! Usa localStorage para dados locais. Supabase é para sincronização nuvem.

**P: Como adiciono mais categorias?**  
R: Use `addCustomCategory()` ou edite `src/constants/categories.js`.

**P: Posso usar em produção?**  
R: Sim! O código é production-ready desde v2.0.

**P: Como faço backup dos dados?**  
R: Com Supabase, os dados são backed up automaticamente.

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT © 2026 FinançasAPP

## 👥 Autores

Desenvolvido com ❤️ para ajudá-lo a gerir suas finanças de forma inteligente.

## 📞 Suporte

- 📖 Leia a [documentação](./DOCUMENTATION_INDEX.md)
- ⚡ Comece pelo [QUICK_START.md](./QUICK_START.md)
- 🏆 Veja o [RESUMO_EXECUTIVO.md](./RESUMO_EXECUTIVO.md)
- 📚 Consulte [NOVOS_RECURSOS.md](./NOVOS_RECURSOS.md)

---

<div align="center">

**Desenvolvido em April 2026**  
**v2.0 | Production Ready** ✅

[⭐ Ficou legal? Dê uma estrela!](https://github.com/davipgouveia/Finan-as)

[Comece Agora →](./QUICK_START.md)

</div>

Depois disso, os acessos aos dados ficam restritos ao grupo do usuario autenticado.

## Fluxo da Aplicação (modo online)
- Login e cadastro por email/senha (Supabase Auth)
- Onboarding do primeiro acesso (criação de grupo familiar)
- Dashboard carregando transações reais do banco
- Inclusão e exclusão de transações direto no Supabase
- Categorias criadas automaticamente quando novas
- Isolamento total por grupo familiar via RLS

## Observações
- Os dados ficam salvos no localStorage do navegador.
- Se limpar dados do navegador, as transações também serão removidas.
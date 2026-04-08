# FinançasAPP - Documentação de Desenvolvimento

## 1. Visão Geral
O **FinançasAPP** é um aplicativo de controle financeiro multiusuário, desenvolvido como um PWA (Progressive Web App). O foco é ser intuitivo, rápido e preparado para uso em grupos e famílias.

## 2. Stack Tecnológica
- **Framework:** React.js (Vite)
- **Estilização:** Tailwind CSS (Design Minimalista/Dark Mode)
- **Ícones:** Lucide-React
- **Gráficos:** Recharts
- **Persistência:** LocalStorage (Inicial) / Estrutura preparada para Firebase futuramente.
- **Distribuição:** PWA (Web instalável)

## 3. Estrutura de Dados (JSON)
Cada transação deve seguir este modelo:
```json
{
  "id": "timestamp",
  "descricao": "Mercado",
  "valor": 150.50,
  "tipo": "despesa", // ou "receita"
  "categoria": "Alimentação",
  "data": "2026-04-08",
  "usuario": "D" // ou "L"
}
```

## 4. Funcionalidades Implementadas
- Persistência local com localStorage (offline-first)
- Dashboard com saldo total, total de receitas e total de despesas
- Gráfico de rosca por categorias
- Lista simplificada das últimas 10 transações
- Cadastro e remoção de transações
- Filtro por usuário (Davi, Laryssa, Total do casal)
- Botão flutuante para ação rápida (FAB)
- PWA instalável com manifest e service worker

## 5. Arquitetura (Context API)
- O estado global está no FinanceContext
- Ao adicionar ou remover transações, resumo e gráfico são recalculados automaticamente
- O filtro por usuário afeta dashboard, gráfico e lista de transações

## 6. Estrutura de Pastas
```text
src/
├─ components/
│  ├─ SummaryCard.jsx
│  ├─ TransactionItem.jsx
│  └─ TransactionModal.jsx
├─ context/
│  └─ FinanceContext.jsx
├─ utils/
│  └─ format.js
├─ App.jsx
├─ index.css
└─ main.jsx
```

## 7. Execução do Projeto
```bash
npm install
npm run dev
```

## 8. Build de Produção
```bash
npm run build
npm run preview
```

## 9. Observação Acadêmica
O projeto foi desenvolvido para portfólio Mackenzie - Sistemas de Informação, com ênfase em conceitos de UI mobile, PWA e multi-tenancy simples por filtro de usuário.
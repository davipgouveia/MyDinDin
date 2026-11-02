# MyDinDin

App de gestão financeira multiusuário (grupos familiares), no ar em
[mydindin.com.br](https://mydindin.com.br). Lançamentos, orçamentos,
categorias, relatórios e chat com IA — como PWA instalável, direto do
navegador.

## Stack

- **Next.js 15** (App Router) + React 19 + Tailwind CSS 3
- **Supabase** — autenticação e banco (Postgres com RLS em todas as tabelas)
- **Resend** — envio de e-mails (sempre via rota de servidor autenticada)
- **Gemini** — chat com IA via rota de servidor (`/api/ai/chat`); sem a
  chave configurada, o chat responde com o cérebro local do app

## Como rodar

```bash
npm install
npm run dev     # desenvolvimento
npm run build   # build de produção
npm start       # servidor de produção
```

## Variáveis de ambiente

Copie os nomes abaixo para o `.env.local` (e para o projeto na Vercel).
Nunca coloque valores reais neste arquivo nem exponha segredos em
variáveis `NEXT_PUBLIC_` (elas são embutidas no JavaScript enviado ao
navegador de todos os visitantes).

```bash
# Supabase (cliente)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (servidor)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# E-mail (Resend)
RESEND_API_KEY=
[SECURITY_DATA]
NEXT_PUBLIC_RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_APP_URL=

# IA (somente servidor — NUNCA expor no cliente)
GEMINI_API_KEY=
```

## Estrutura

- `app/` — rotas e páginas (Next.js App Router) e rotas de API
  (`app/api/`)
- `src/` — componentes, contextos, hooks, constantes e bibliotecas do
  cliente
- `shared/` — utilitários compartilhados (formatação)
- `supabase/` — migrations e configuração do banco
- `public/` — assets e manifest do PWA

## Histórico recente

- **v2.5.0** — faxina do repositório: removidos os restos da fase Vite,
  o template mobile Expo (o PWA cobre o uso móvel) e as dependências
  React Native/Expo do pacote do site; documentação consolidada neste
  README.
- **v2.4.1** — pacote de segurança: relay de e-mail fechado com login,
  XSS do chat corrigido, chave do Gemini movida para rota de servidor,
  rate limit nas rotas sensíveis e senha mínima de 8 caracteres.

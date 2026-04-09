# Project Guidelines

## Code Style
- Use React function components and hooks.
- Prefer Tailwind utility classes over CSS modules or styled-components.
- Keep the UI mobile-first, dark, and consistent with the existing finance-dashboard look.
- Reuse the current libraries and patterns: `lucide-react`, `framer-motion`, `sonner`, `recharts`, `date-fns`, and `zustand` when state needs justify it.
- Keep copy in Portuguese unless the user explicitly asks to change the language.

## Architecture
- `src/context/FinanceContext.jsx` owns auth/session state, profile loading, transactions, summaries, and Supabase-backed data access.
- `src/context/TransactionCategoryContext.jsx` owns categories, reminders, recurring payments, ordering, and localStorage persistence.
- `src/lib/supabaseClient.js` exposes `isSupabaseConfigured`; guard Supabase usage before making network calls.
- `src/App.jsx` composes the main providers and feature panels; keep new UI pieces aligned with that composition.
- Normalize Supabase rows in the finance context instead of spreading mapping logic across components.

## Build and Test
- Install dependencies with `npm install`.
- Run the app with `npm run dev`.
- Verify production changes with `npm run build`.
- Use `npm run preview` to smoke-test the built output.
- There is no configured automated test suite in this workspace, so validate behavior manually and make the build pass.

## Conventions
- Follow the existing offline-first fallback: the app should still work when Supabase is unavailable.
- Keep async data loading resilient with bounded timeouts and graceful error handling.
- Prefer the current component boundaries instead of merging unrelated logic into `App.jsx`.
- Do not duplicate documentation in code comments; link to the existing docs instead.
- Relevant docs: [README.md](README.md), [QUICK_START.md](QUICK_START.md), [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md), [NOVOS_RECURSOS.md](NOVOS_RECURSOS.md), [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md), and [docs/ESTRUTURA_PROJETO.md](docs/ESTRUTURA_PROJETO.md).
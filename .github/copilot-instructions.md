# Project Guidelines

## Code Style
- Use React function components and hooks.
- Prefer Tailwind utility classes over CSS modules or styled-components.
- Keep the UI mobile-first, dark, and consistent with the existing finance-dashboard look.
- Reuse the current libraries and patterns: `lucide-react`, `framer-motion`, `sileo`, `recharts`, `date-fns`, and `zustand` when state needs justify it.
- Keep copy in Portuguese unless the user explicitly asks to change the language.

## Architecture
- Runtime is Next.js App Router. Use `app/layout.jsx` for root layout/metadata and `app/page.jsx` as the client wrapper that composes providers and mounts `src/App.jsx`.
- `src/context/FinanceContext.jsx` owns auth/session state, profile loading, transactions, summaries, and Supabase-backed data access.
- `src/context/TransactionCategoryContext.jsx` owns categories, reminders, recurring payments, ordering, and localStorage persistence.
- `src/context/PreferencesContext.jsx` owns theme, language, accent, density, and layout mode state backed by localStorage.
- `src/lib/supabaseClient.js` exposes `isSupabaseConfigured`; guard Supabase usage before making network calls.
- Keep new UI pieces aligned with existing boundaries; avoid merging unrelated domain logic into `src/App.jsx`.
- Normalize Supabase rows in the finance context instead of spreading mapping logic across components.

## Build and Test
- Install dependencies with `npm install`.
- Run the app with `npm run dev` (Next.js dev server).
- Verify production changes with `npm run build`.
- Use `npm run preview` (Next.js start) to smoke-test the built output.
- There is no configured automated test suite in this workspace, so validate behavior manually and make the build pass.

## Conventions
- Follow the existing offline-first fallback: the app should still work when Supabase is unavailable.
- Keep async data loading resilient with bounded timeouts and graceful error handling.
- Guard Supabase usage with `isSupabaseConfigured && supabase` and prefer graceful fallback behavior when env vars are missing.
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client Supabase config; keep server-only keys (like `RESEND_API_KEY`) out of client code.
- Always update both `package.json` version and `src/constants/appMeta.js` (`APP_VERSION`) when shipping changes.
- Keep localStorage key naming consistent with the existing `mydindin_*` prefix pattern.
- Do not duplicate documentation in code comments; link to the existing docs instead.
- Relevant docs: [README.md](README.md), [QUICK_START.md](QUICK_START.md), [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md), [NOVOS_RECURSOS.md](NOVOS_RECURSOS.md), [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md), and [docs/ESTRUTURA_PROJETO.md](docs/ESTRUTURA_PROJETO.md).

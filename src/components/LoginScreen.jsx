import Logo from './Logo'
import { AppFooter } from './AppFooter'
import { usePreferences } from '../context/PreferencesContext'

export function LoginScreen({ children, variant = 'signin' }) {
  const { theme, accent, density, layoutMode } = usePreferences()
  const isSignUp = variant === 'signup'
  const isLight = theme === 'light'
  const isCompact = density === 'compact'
  const isFocusLayout = layoutMode === 'focus'
  const accentGlowClass =
    accent === 'emerald'
      ? 'bg-emerald-400/15'
      : accent === 'amber'
        ? 'bg-amber-400/15'
        : 'bg-cyan-400/15'

  return (
    <main
      className={`relative min-h-screen overflow-hidden px-4 py-6 text-white sm:py-8 ${
        isSignUp
          ? 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900'
          : 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className={`absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full blur-3xl ${isLight ? 'bg-sky-300/20' : 'bg-white/10'}`} />
        <div
          className={`absolute right-[-6rem] top-24 h-80 w-80 rounded-full blur-3xl ${
            isSignUp ? 'bg-emerald-400/15' : isLight ? 'bg-sky-400/15' : 'bg-cyan-400/10'
          }`}
        />
        <div className={`absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl ${isLight ? 'bg-slate-300/20' : 'bg-white/5'}`} />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center justify-center">
        <div className={`grid w-full ${isCompact ? 'gap-6' : 'gap-8'} ${isFocusLayout ? 'xl:grid-cols-1' : 'xl:grid-cols-[1.05fr_0.95fr]'} xl:items-center`}>
          <section className={`flex flex-col items-start rounded-[2rem] border ${isCompact ? 'gap-4 p-5' : 'gap-6 p-6'} shadow-2xl backdrop-blur-xl sm:p-8 ${isLight ? 'border-slate-200 bg-white/80 text-slate-900' : 'border-white/10 bg-white/8 text-white'}`}>
            <div
              className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-medium tracking-[0.24em] uppercase ${
                isSignUp
                  ? isLight
                    ? 'border-emerald-400/25 bg-emerald-100 text-emerald-800'
                    : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
                  : isLight
                    ? 'border-slate-300 bg-slate-100 text-slate-600'
                    : 'border-white/15 bg-white/8 text-white/70'
              }`}
            >
              {isSignUp ? 'Nova Conta' : 'MyDinDin'}
            </div>
            <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-center">
              <div
                className={`flex shrink-0 items-center justify-center rounded-[2rem] border p-5 ${
                  isSignUp
                    ? isLight
                      ? 'border-emerald-400/25 bg-emerald-100 shadow-[0_0_60px_rgba(16,185,129,0.14)]'
                      : 'border-emerald-300/25 bg-emerald-300/10 shadow-[0_0_60px_rgba(16,185,129,0.2)]'
                    : isLight
                      ? 'border-sky-400/20 bg-sky-100 shadow-[0_0_60px_rgba(56,189,248,0.14)]'
                      : `border-cyan-400/20 ${accentGlowClass} shadow-[0_0_60px_rgba(34,211,238,0.16)]`
                }`}
              >
                <Logo size="xlarge" animated />
              </div>
              <div className="max-w-xl">
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                  {isSignUp ? 'Crie seu espaço financeiro em poucos passos' : 'Gestão financeira para grupos e famílias'}
                </h1>
                <p className={`mt-4 max-w-xl text-base leading-7 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {isSignUp
                    ? 'Comece com seu grupo, personalize categorias e ative lembretes para manter tudo sob controle desde o primeiro dia.'
                    : 'Controle despesas, receitas, contas recorrentes e alertas com uma experiência visual mais clara e profissional.'}
                </p>
              </div>
            </div>

            <div className={`grid w-full gap-3 ${isCompact ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-3'}`}>
              {[
                isSignUp ? 'Configuração guiada do grupo' : 'Alertas por email via Resend',
                isSignUp ? 'Entrada inicial simplificada' : 'Categorias customizadas',
                isSignUp ? 'Visual focado em onboarding' : 'Vencimentos opcionais',
              ].map((item) => (
                <div key={item} className={`rounded-2xl border px-4 py-3 text-sm ${isLight ? 'border-slate-200 bg-white/90 text-slate-700' : 'border-white/10 bg-black/15 text-slate-200'}`}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className={`rounded-[2rem] border ${isCompact ? 'p-4' : 'p-5'} shadow-2xl backdrop-blur-xl sm:p-6 ${isLight ? 'border-slate-200 bg-white/85 text-slate-900' : 'border-white/10 bg-slate-950/70 text-white'}`}>
            {children}
          </section>
        </div>
      </div>
      <AppFooter className="relative mt-4" />
    </main>
  )
}

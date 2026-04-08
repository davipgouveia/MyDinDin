import Logo from './Logo'

export function LoginScreen({ children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="flex flex-col items-start gap-6 rounded-[2rem] border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-medium tracking-[0.24em] text-white/70 uppercase">
              FinançasAPP
            </div>
            <div className="flex items-center gap-4">
              <Logo size="large" animated />
              <div>
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Gestão financeira para grupos e famílias</h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                  Controle despesas, receitas, contas recorrentes e alertas com uma experiência visual mais clara e profissional.
                </p>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3">
              {[
                'Alertas por email via Resend',
                'Categorias customizadas',
                'Vencimentos opcionais',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl">
            {children}
          </section>
        </div>
      </div>
    </main>
  )
}

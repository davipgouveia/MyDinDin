import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10">
      <section className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 p-8 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">MyDinDin</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          O caminho solicitado não existe ou foi movido. Volte para a aplicação para continuar acompanhando suas finanças.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Voltar ao painel
        </Link>
      </section>
    </main>
  )
}
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace('/')
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [router])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center p-4">
      <section className="w-full rounded-3xl border border-emerald-400/20 bg-slate-900/80 p-6 text-center">
        <h1 className="text-lg font-semibold text-emerald-300">Email confirmado</h1>
        <p className="mt-2 text-sm text-slate-300">
          Sua verificacao foi concluida. Voce sera redirecionado para entrar na conta.
        </p>
      </section>
    </main>
  )
}

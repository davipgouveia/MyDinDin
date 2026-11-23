"use client"

import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Copy, Check, Plus, Ban } from 'lucide-react'
import { getAuthHeaders } from '../../lib/authToken'
import { fmtDate } from './ShoppingModule'

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()), ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Erro ${response.status}`)
  return data
}

function buildKit(origin, token) {
  return `Conecte-se à API de Compras do MyDinDin da minha família e use-a sempre que eu falar de lista de compras, compras de mercado, preços ou estoque de casa.

Base: ${origin}/api/compras
Autenticação: em toda chamada (menos /health), envie o header:
  Authorization: Bearer ${token}

Endpoints principais (produtos e lojas podem ser referenciados por nome ou id):
- GET /overview — lista pendente, o que está acabando e o gasto do mês
- GET /shopping-list?include_done=true — a lista de compras
- POST /shopping-list {"name": "Arroz", "quantity": 2} — adicionar item
- PATCH /shopping-list/{id} {"done": true} — marcar como comprado
- POST /purchases {"store": "Assaí", "date": "2026-11-23", "items": [{"product": "Arroz", "quantity": 2, "unit_price": 21.9}]} — registrar compra (baixa a lista e lança a despesa nas finanças; use "finance": false para não lançar)
- GET /purchases?limit=50 — histórico de compras
- GET /forecast — previsão de término dos produtos
- POST /products/{nome}/finished — marcar que um produto acabou
- GET /products/{nome}/prices — histórico de preços e loja mais barata
- GET /compare — último preço de cada produto por loja
- GET /shopping-list/plan — plano da próxima compra (melhor loja por item e custo estimado)
- GET /spending?group_by=month|store|category — gastos agrupados
- GET /search?q=arr — buscar produtos e lojas

Responda sempre em português e confirme comigo antes de registrar compras grandes.`
}

export function ApiView({ panelClass, panelSoftClass, toast }) {
  const [tokens, setTokens] = useState([])
  const [name, setName] = useState('Meu Muse')
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setTokens(await api('/api/compras/tokens'))
    } catch (err) {
      toast.error(err.message || 'Não foi possível carregar os tokens.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function createToken(e) {
    e.preventDefault()
    try {
      const data = await api('/api/compras/tokens', { method: 'POST', body: JSON.stringify({ name: name.trim() || 'Meu Muse' }) })
      setCreated(data)
      setCopied(false)
      await load()
      toast.success('Token criado! Copie agora — ele não aparece de novo.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível criar o token.')
    }
  }

  async function revoke(token) {
    try {
      await api(`/api/compras/tokens/${token.id}`, { method: 'DELETE' })
      await load()
      toast.success('Token revogado.')
    } catch (err) {
      toast.error(err.message || 'Não foi possível revogar.')
    }
  }

  async function copyKit() {
    if (!created?.token) return
    const kit = buildKit(window.location.origin, created.token)
    try {
      await navigator.clipboard.writeText(kit)
      setCopied(true)
    } catch {
      toast.error('Não consegui copiar automaticamente — selecione o texto e copie manualmente.')
    }
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelClass}`}>
        <div className="mb-1 flex items-center gap-2">
          <KeyRound size={17} className="text-cyan-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Sua API pessoal de compras</h3>
        </div>
        <p className="text-sm text-slate-400">
          Gere um token e entregue ao seu Muse (o seu assistente pessoal): ele passa a consultar e operar a
          lista de compras da família — ver a lista, adicionar itens, registrar compras, comparar preços e
          avisar o que está acabando. Cada pessoa do grupo gera o próprio token, e tudo que o token faz fica
          registrado como ação sua. Trate o token como uma senha: quem tem ele acessa as compras do grupo.
        </p>

        <form onSubmit={createToken} className="mt-4 flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do token (ex.: Meu Muse)"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
          />
          <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
            <Plus size={15} /> Gerar token
          </button>
        </form>

        {created?.token && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-bold text-amber-200">Token criado — copie agora, ele não será mostrado de novo:</p>
            <code className="mt-2 block break-all rounded-lg bg-slate-950/70 px-3 py-2 text-xs text-amber-100">{created.token}</code>
            <button
              type="button"
              onClick={copyKit}
              className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copiado!' : 'Copiar o texto pronto pro meu Muse'}
            </button>
            <p className="mt-2 text-xs text-amber-200/80">
              O texto copiado traz a API, o token e as instruções — é só colar na conversa com o seu Muse
              (igual a uma ficha de configuração). Depois guarde o token num lugar seguro.
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Meus tokens</p>
          {loading ? (
            <p className="text-sm text-slate-500">Carregando…</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum token ainda. Gere o primeiro acima.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {tokens.map((token) => (
                <li key={token.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                  <span className="font-semibold">{token.name}</span>
                  <span className="text-xs text-slate-500">
                    criado em {fmtDate(token.created_at)}
                    {token.last_used_at ? ` · último uso ${fmtDate(token.last_used_at)}` : ' · nunca usado'}
                  </span>
                  {token.revoked_at ? (
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-300">revogado</span>
                  ) : (
                    <>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">ativo</span>
                      <button
                        type="button"
                        onClick={() => revoke(token)}
                        className="ml-auto flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-rose-400/50 hover:text-rose-300"
                      >
                        <Ban size={13} /> Revogar
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={`rounded-[1.75rem] border p-4 md:p-5 ${panelSoftClass}`}>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Endpoints da API</h4>
        <ul className="grid gap-x-6 gap-y-1 text-xs text-slate-400 sm:grid-cols-2">
          {[
            'GET /api/compras/overview', 'GET /api/compras/me', 'GET /api/compras/search?q=',
            'GET/POST /api/compras/stores', 'GET/POST /api/compras/products',
            'GET /api/compras/products/{nome}/prices', 'POST /api/compras/products/{nome}/finished',
            'GET /api/compras/compare', 'GET/POST /api/compras/purchases',
            'GET /api/compras/spending?group_by=month', 'GET /api/compras/forecast',
            'GET/POST /api/compras/shopping-list', 'GET /api/compras/shopping-list/plan',
            'POST /api/compras/shopping-list/from-forecast',
          ].map((line) => <li key={line} className="font-mono">{line}</li>)}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Autenticação: header <span className="font-mono">Authorization: Bearer mdd_...</span> (ou a sessão do app).
          Produtos e lojas podem ser referenciados por nome ou id.
        </p>
      </div>
    </div>
  )
}

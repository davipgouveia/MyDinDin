// Helpers das rotas app/api/compras: autenticacao (sessao ou token
// pessoal) + respostas JSON padronizadas.
import { NextResponse } from 'next/server'
import { resolveApiAuth } from './comprasServer'

export const json = (data, status = 200) => NextResponse.json(data, { status })
export const fail = (message, status = 400) => NextResponse.json({ error: message }, { status })

export async function withAuth(request, handler) {
  try {
    const auth = await resolveApiAuth(request)
    if (!auth) return fail('Não autorizado. Envie o token da sessão ou um token de API (Bearer mdd_...).', 401)
    return await handler(auth)
  } catch (error) {
    return fail(error.message || 'Erro inesperado.', 500)
  }
}

// Somente sessao do app (gestao de tokens nao aceita token de API).
export async function withSession(request, handler) {
  try {
    const auth = await resolveApiAuth(request)
    if (!auth) return fail('Não autorizado.', 401)
    if (auth.via !== 'session') return fail('Gestão de tokens só pela sessão do app.', 403)
    return await handler(auth)
  } catch (error) {
    return fail(error.message || 'Erro inesperado.', 500)
  }
}

export async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

// src/lib/serverAuth.js
// Utilitários de servidor: identificar o usuário logado a partir do
// token de sessão (Authorization: Bearer <access_token> do Supabase).
import { createClient } from '@supabase/supabase-js'

export async function getUserFromRequest(request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const authHeader = request.headers.get('authorization') || ''

  if (!supabaseUrl || !anonKey || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await client.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  return forwarded.split(',')[0].trim() || 'desconhecido'
}

// src/lib/authToken.js
// Cabeçalho de autenticação com o token da sessão atual do Supabase,
// para as chamadas do cliente às rotas de API protegidas do MyDinDin.
import { supabase } from './supabaseClient'

export async function getAuthHeaders() {
  try {
    if (!supabase) return {}
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

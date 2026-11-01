// src/lib/rateLimit.js
// Rate limit simples em memória (por instância do servidor).
// Suficiente para conter abuso básico nas rotas públicas; para limites
// globais entre instâncias, migrar para um store compartilhado (ex.: Upstash).
const buckets = new Map()

export function rateLimit(key, limit, windowMs) {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { start: now, count: 1 })
    return { ok: true, retryAfterSeconds: 0 }
  }

  entry.count += 1
  if (entry.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((entry.start + windowMs - now) / 1000),
    }
  }

  return { ok: true, retryAfterSeconds: 0 }
}

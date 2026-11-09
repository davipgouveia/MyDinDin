// Service worker do MyDinDin (v3).
//
// A v2 era "cache-first pra tudo" com nome de cache fixo: o celular
// guardava a página e os scripts da primeira visita e servia essa
// versão velha PRA SEMPRE (foi assim que o import de PDF "não existia"
// no celular mesmo depois de publicado). Também cacheava respostas da
// API, servindo dado financeiro velho.
//
// Regras da v3:
// - Página (navegação): REDE primeiro — a versão nova aparece na hora;
//   o cache só entra offline.
// - Arquivos estáticos com hash no nome (scripts/estilos do Next,
//   ícones): cache primeiro faz sentido, eles nunca mudam de conteúdo.
// - Qualquer outra origem (Supabase/API): NÃO intercepta — nunca
//   cachear dado financeiro nem resposta de login.
const CACHE_NAME = 'mydindin-cache-v3'
const APP_SHELL = ['/', '/manifest.json', '/icons/icon-192.svg', '/icons/icon-512.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Outra origem (Supabase, fontes, etc.): passa direto, sem cache.
  if (url.origin !== self.location.origin) return

  // Navegação (abrir/atualizar a página): rede primeiro.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/', responseClone))
          return networkResponse
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Estáticos versionados/imutáveis: cache primeiro, rede preenche.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((networkResponse) => {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          return networkResponse
        })
      }),
    )
    return
  }

  // Resto da mesma origem: rede primeiro, cache como reserva.
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        return networkResponse
      })
      .catch(() => caches.match(request)),
  )
})

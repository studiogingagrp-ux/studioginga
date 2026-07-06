// Service worker — Ginga Studio OS (PWA)
// v2: network-first pra nunca servir versão velha (evita cache preso do demo).
const CACHE = 'ginga-v2'
const APP_SHELL = ['/offline', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Navegações: sempre rede (versão fresca), com fallback para a página offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')))
    return
  }

  // Demais GET: REDE PRIMEIRO (nunca serve build velho); cache só como backup offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && new URL(request.url).origin === self.location.origin) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
        }
        return res
      })
      .catch(() => caches.match(request)),
  )
})

// Service worker DESATIVADO (kill-switch).
// Motivo: o cache do PWA estava servindo versões velhas presas nos
// dispositivos (login quebrado). Este SW se autodestrói: limpa todos os
// caches, se desregistra e recarrega a página — assim qualquer aparelho
// com versão antiga se conserta sozinho ao abrir, sem limpar nada à mão.

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
        await self.registration.unregister()
        const clients = await self.clients.matchAll({ type: 'window' })
        clients.forEach((c) => c.navigate(c.url))
      } catch {
        /* nada a fazer */
      }
    })(),
  )
})

// Sem handler de fetch: nada é interceptado nem cacheado (vai sempre à rede).

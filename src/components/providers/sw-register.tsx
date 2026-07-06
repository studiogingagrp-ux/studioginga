'use client'

import { useEffect } from 'react'

/**
 * PWA/service worker DESATIVADO por estabilidade.
 * Remove qualquer service worker antigo e limpa os caches do dispositivo —
 * evita que uma versão velha fique presa em cache (causava login quebrado).
 */
export function SwRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {})
    }
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
    }
  }, [])
  return null
}

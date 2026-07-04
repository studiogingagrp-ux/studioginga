'use client'

import { useEffect } from 'react'

/** Registra o service worker (apenas em produção, para não interferir no HMR). */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}

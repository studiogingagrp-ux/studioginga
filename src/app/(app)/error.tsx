'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

const RECOVER_KEY = 'ginga_app_err_recovered'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [recovering, setRecovering] = useState(true)

  useEffect(() => {
    console.error(error)
    let already = false
    try { already = sessionStorage.getItem(RECOVER_KEY) === '1' } catch {}
    if (!already) {
      try { sessionStorage.setItem(RECOVER_KEY, '1') } catch {}
      window.location.reload()
      return
    }
    try { sessionStorage.removeItem(RECOVER_KEY) } catch {}
    setRecovering(false)
  }, [error])

  if (recovering) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center text-center">
        <RefreshCw className="size-6 animate-spin text-brand" />
        <p className="mt-3 text-sm text-muted-foreground">Atualizando…</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-rose-500/15 text-rose-300">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="mt-5 font-display text-xl font-bold text-foreground">Erro ao carregar</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Não foi possível carregar esta página. Tente de novo — se continuar, volte ao início.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => { try { sessionStorage.removeItem(RECOVER_KEY) } catch {}; reset() }}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-secondary"
        >
          <RefreshCw className="size-4" /> Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Home className="size-4" /> Início
        </Link>
      </div>
    </div>
  )
}

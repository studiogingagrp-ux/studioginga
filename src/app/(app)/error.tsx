'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="mt-5 font-heading text-xl font-semibold text-foreground">Erro ao carregar</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {error.message || 'Não foi possível carregar esta página.'}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-secondary"
        >
          <RefreshCw className="size-4" /> Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Home className="size-4" /> Dashboard
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="mt-5 font-heading text-xl font-semibold text-foreground">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
      >
        <RefreshCw className="size-4" /> Tentar novamente
      </button>
    </div>
  )
}

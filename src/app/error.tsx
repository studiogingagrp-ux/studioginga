'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// Erros de "chunk velho"/hidratação (deploy recente + cache do navegador) somem
// com uma recarga limpa. Auto-recupera 1x por sessão; se persistir, mostra a UI.
const RECOVER_KEY = 'ginga_err_recovered'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [recovering, setRecovering] = useState(true)

  useEffect(() => {
    console.error(error)
    let already = false
    try { already = sessionStorage.getItem(RECOVER_KEY) === '1' } catch {}
    if (!already) {
      try { sessionStorage.setItem(RECOVER_KEY, '1') } catch {}
      // recarrega buscando HTML+chunks frescos do servidor
      window.location.reload()
      return
    }
    // já tentou recarregar e ainda deu erro → é real, libera a limpeza pra próxima vez
    try { sessionStorage.removeItem(RECOVER_KEY) } catch {}
    setRecovering(false)
  }, [error])

  if (recovering) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
        <RefreshCw className="size-6 animate-spin text-brand" />
        <p className="mt-3 text-sm text-muted-foreground">Atualizando…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-rose-500/15 text-rose-300">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="mt-5 font-display text-xl font-bold text-foreground">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Tivemos um tropeço ao carregar. Tente de novo — se continuar, recarregue a página.
      </p>
      <button
        onClick={() => { try { sessionStorage.removeItem(RECOVER_KEY) } catch {}; reset() }}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95"
      >
        <RefreshCw className="size-4" /> Tentar novamente
      </button>
    </div>
  )
}

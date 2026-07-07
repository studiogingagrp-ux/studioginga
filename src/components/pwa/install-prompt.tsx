'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BIPEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'ginga_pwa_dismiss'

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false)
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    setMounted(true)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true
    setInstalled(standalone)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent) && !(navigator as unknown as { MSStream?: unknown }).MSStream)
    setNarrow(window.matchMedia('(max-width: 900px)').matches)
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')

    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent) }
    const onInstalled = () => { setInstalled(true); setDeferred(null) }
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  async function install() {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferred(null)
    } else if (isIOS) {
      setShowGuide(true)
    }
  }

  // Nunca mostra: sem montar, instalado, dispensado, ou sem gatilho de instalação
  if (!mounted || installed || dismissed) return null
  if (!deferred && !isIOS && !narrow) return null

  return (
    <>
      {/* z-40: fica ABAIXO de sheets/dialogs (z-50) pra nunca cobrir botões de formulário */}
      <div className="animate-rise fixed inset-x-4 bottom-4 z-40 sm:left-auto sm:right-4 sm:w-[340px]">
        <div className="ginga-glow overflow-hidden rounded-2xl border border-brand/30 bg-card/95 p-4 shadow-pop backdrop-blur-xl">
          <button onClick={dismiss} aria-label="Fechar" className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10">
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="Ginga Studio" className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 pr-6">
              <p className="font-display text-sm font-bold text-foreground">Instale o Ginga Studio</p>
              <p className="text-xs leading-snug text-muted-foreground">Acesso rápido, tela cheia e notificações — como um app.</p>
            </div>
          </div>
          <button onClick={install} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95">
            <Download className="size-4" /> Instalar app
          </button>
        </div>
      </div>

      {/* Guia iPhone */}
      {showGuide && (
        <div className="fixed inset-0 z-[130] flex items-end sm:items-center sm:justify-center" onClick={() => setShowGuide(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="animate-rise relative w-full rounded-t-3xl border border-border bg-card p-6 sm:max-w-sm sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowGuide(false)} className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/10"><X className="size-4" /></button>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="" className="size-12 rounded-xl" />
              <div>
                <p className="font-display text-base font-bold text-foreground">Instalar no iPhone</p>
                <p className="text-xs text-muted-foreground">Leva 5 segundos, no Safari</p>
              </div>
            </div>
            <ol className="mt-5 space-y-3">
              <Step n={1}>Toque em <span className="mx-1 inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 font-medium text-foreground"><Share className="size-3.5 text-brand" /> Compartilhar</span> na barra do Safari.</Step>
              <Step n={2}>Role e toque em <span className="mx-1 inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 font-medium text-foreground"><Plus className="size-3.5 text-brand" /> Adicionar à Tela de Início</span>.</Step>
              <Step n={3}>Confirme em <b className="text-foreground">Adicionar</b> — pronto, o app aparece na sua tela! 🎉</Step>
            </ol>
            <button onClick={() => { setShowGuide(false); dismiss() }} className="mt-6 h-11 w-full rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold">Entendi</button>
          </div>
        </div>
      )}
    </>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={cn('grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 font-display text-xs font-bold text-brand')}>{n}</span>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </li>
  )
}

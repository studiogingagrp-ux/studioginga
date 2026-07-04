import type { Metadata } from 'next'
import { WifiOff } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { GrpCredit } from '@/components/brand/grp-credit'

export const metadata: Metadata = { title: 'Sem conexão' }

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-secondary/40 px-6 text-center">
      <Logo />
      <span className="grid size-16 place-items-center rounded-2xl bg-accent text-brand shadow-soft">
        <WifiOff className="size-7" />
      </span>
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Você está sem conexão</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Verifique sua internet. Assim que reconectar, seus dados voltam a sincronizar automaticamente.
        </p>
      </div>
      <GrpCredit />
    </div>
  )
}

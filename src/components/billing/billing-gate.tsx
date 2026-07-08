'use client'

import { useState, useTransition } from 'react'
import { AlarmClock, Lock, ExternalLink, RefreshCw, CheckCircle2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/brand/logo'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { verifyMyBilling } from '@/lib/actions/billing'
import { ROLE_COOKIE } from '@/lib/constants/roles'

const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Faixa de aviso: "sua assinatura vence em X dias" (renderizada acima do conteúdo). */
export function BillingBanner({ daysLeft, dueDate, paymentLink }: { daysLeft: number; dueDate: string; paymentLink?: string | null }) {
  const urgent = daysLeft <= 1
  return (
    <div className={cn(
      'mb-5 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3',
      urgent ? 'border-rose-500/30 bg-rose-500/10' : 'border-amber-500/30 bg-amber-500/10',
    )}>
      <AlarmClock className={cn('size-4 shrink-0', urgent ? 'text-rose-300' : 'text-amber-300')} />
      <p className="min-w-0 flex-1 text-sm text-foreground">
        {daysLeft === 0
          ? <>Sua assinatura <b>vence hoje</b> ({fmt(dueDate)}). Pague para não perder o acesso amanhã.</>
          : <>Sua assinatura vence em <b>{daysLeft} dia{daysLeft > 1 ? 's' : ''}</b> ({fmt(dueDate)}).</>}
      </p>
      {paymentLink && (
        <a href={paymentLink} target="_blank" rel="noopener noreferrer"
          className={cn('inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-black transition-transform hover:scale-[1.02]',
            urgent ? 'bg-rose-400' : 'bg-amber-400')}>
          <ExternalLink className="size-3.5" /> Pagar agora
        </a>
      )}
    </div>
  )
}

/** Tela de bloqueio: vencido há 1+ dia e não pago. Só sai daqui pagando. */
export function BillingBlockedScreen({ dueDate, paymentLink, workspaceName }: { dueDate: string | null; paymentLink?: string | null; workspaceName: string }) {
  const router = useRouter()
  const [checking, start] = useTransition()
  const [lastCheck, setLastCheck] = useState<string | null>(null)

  function verificar() {
    start(async () => {
      const res = await verifyMyBilling()
      if (res.error) { toast.error(res.error); return }
      if (res.blocked === false) {
        toast.success('Pagamento confirmado — acesso liberado! 🎉')
        router.refresh()
      } else {
        setLastCheck(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        toast.info('Ainda não identificamos o pagamento.', { description: 'Pix libera em minutos; boleto pode levar 1 dia útil após o pagamento.' })
      }
    })
  }

  async function sair() {
    if (isSupabaseConfigured()) await createClient().auth.signOut()
    document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`
    router.replace('/login')
  }

  return (
    <div className="ginga-grain relative grid min-h-screen place-items-center bg-background px-5">
      <div aria-hidden className="ginga-glow pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-rose-500/25 bg-card shadow-pop">
          <div className="border-b border-border bg-rose-500/[0.07] px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-rose-500/15 text-rose-300"><Lock className="size-5" /></span>
              <div>
                <p className="kicker text-rose-300">Acesso suspenso</p>
                <h1 className="font-display text-lg font-extrabold text-foreground">Assinatura vencida</h1>
              </div>
            </div>
          </div>
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              A mensalidade do <b className="text-foreground">{workspaceName}</b>
              {dueDate ? <> venceu em <b className="text-foreground">{fmt(dueDate)}</b></> : <> está vencida</>} e ainda não identificamos o pagamento.
              Seus dados estão seguros — o acesso volta na hora assim que o pagamento for confirmado.
            </p>
            {paymentLink && (
              <a href={paymentLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95">
                <ExternalLink className="size-4" /> Pagar agora (Pix ou boleto)
              </a>
            )}
            <button onClick={verificar} disabled={checking}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-60">
              {checking ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Já paguei — verificar agora
            </button>
            {lastCheck && <p className="text-center text-[11px] text-muted-foreground/60">Última verificação às {lastCheck}. Pagou por Pix? Tente de novo em 1 minuto.</p>}
            <button onClick={sair} className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <LogOut className="size-3.5" /> Sair da conta
            </button>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 opacity-60">
          <LogoMark className="size-5" />
          <p className="text-[11px] text-muted-foreground">Ginga Studio OS · desenvolvido por GRP Tecnologia</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Sparkles, Rocket } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/logo'
import { setupWorkspace } from '@/lib/actions/team'

export default function OnboardingPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)

  async function criar() {
    if (nome.trim().length < 2) { toast.error('Dê um nome para a sua agência.'); return }
    setLoading(true)
    const res = await setupWorkspace(nome.trim())
    if (res.error) {
      toast.error(res.error)
      setLoading(false)
      return
    }
    toast.success('Agência criada! Bem-vindo. 🎉')
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <div className="ginga-grain relative grid min-h-screen place-items-center bg-background px-4">
      <div aria-hidden className="ginga-glow pointer-events-none fixed inset-0 opacity-70" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 shadow-card backdrop-blur-xl">
        <Logo name="Ginga Studio" className="mb-6" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
          <Rocket className="size-3.5" /> Vamos configurar sua agência
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">
          Bem-vindo ao seu OS 🌀
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Só falta um passo: qual é o nome da sua agência? Você entra como <b className="text-foreground">Dono</b> e já pode montar sua equipe.
        </p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome da agência</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') criar() }}
            placeholder="Ex: Ginga Studio"
            autoFocus
            className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        <button
          onClick={criar}
          disabled={loading}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>Criar minha agência <ArrowRight className="size-4" /></>}
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/60">
          <Sparkles className="size-3.5 text-brand" /> Depois é só convidar seu time em Usuários
        </p>
      </div>
    </div>
  )
}

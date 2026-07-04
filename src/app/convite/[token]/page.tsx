'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { DEMO_ROLE_COOKIE } from '@/lib/constants/roles'

export default function ConvitePage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)

  function entrar() {
    setLoading(true)
    document.cookie = `${DEMO_ROLE_COOKIE}=membro; path=/; max-age=31536000`
    setTimeout(() => router.push('/meu-dia'), 500)
  }

  return (
    <div className="ginga-grain relative grid min-h-screen place-items-center bg-background px-4">
      <div aria-hidden className="ginga-glow pointer-events-none fixed inset-0 opacity-70" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 shadow-card backdrop-blur-xl">
        <Logo name="Ginga Studio" className="mb-6" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
          <Sparkles className="size-3.5" /> Você foi convidado
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">
          Bem-vindo à equipe da Ginga Studio 🌀
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie seu acesso e você já cai direto no seu painel — com suas tarefas, agenda e aprovações do dia.
        </p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Como quer ser chamado?</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        <button
          onClick={entrar}
          disabled={loading}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>Entrar no meu painel <ArrowRight className="size-4" /></>}
        </button>
        <p className="mt-4 text-center text-[11px] text-muted-foreground/60">Ao entrar, você concorda com os termos de uso da Ginga Studio.</p>
      </div>
    </div>
  )
}

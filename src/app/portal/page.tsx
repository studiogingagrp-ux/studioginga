'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { GINGA_CLIENTS } from '@/lib/demo/agency'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export default function PortalLoginPage() {
  const router = useRouter()
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function entrar() {
    const v = valor.trim().toLowerCase()
    if (!v) { setErro('Digite seu e-mail, telefone ou nome da empresa.'); return }
    const digits = v.replace(/\D/g, '')
    const match = GINGA_CLIENTS.find((c) =>
      c.name.toLowerCase().includes(v) ||
      c.contact.toLowerCase().includes(v) ||
      (digits.length >= 4 && c.phone.includes(digits)),
    )
    if (!match) { setErro('Não encontramos esse acesso. Fale com a sua agência.'); return }
    setErro(''); setLoading(true)
    setTimeout(() => router.push(`/portal/${slugify(match.name)}`), 500)
  }

  return (
    <div className="ginga-grain relative grid min-h-screen place-items-center bg-background px-4">
      <div aria-hidden className="ginga-glow pointer-events-none fixed inset-0 opacity-70" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 shadow-card backdrop-blur-xl">
        <Logo name="Ginga Studio" className="mb-6" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
          <Sparkles className="size-3.5" /> Portal do cliente
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">Acesse sua conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre para acompanhar seus projetos, aprovar materiais e falar com a equipe.
        </p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail, telefone ou empresa</span>
          <input
            value={valor}
            onChange={(e) => { setValor(e.target.value); setErro('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') entrar() }}
            placeholder="Ex: Casa Lumen"
            className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
        {erro && <p className="mt-2 text-xs text-rose-300">{erro}</p>}

        <button
          onClick={entrar}
          disabled={loading}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>Acessar meu portal <ArrowRight className="size-4" /></>}
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/60">
          <ShieldCheck className="size-3.5 text-emerald-400" /> Acesso seguro sem senha · Ginga Studio
        </p>
      </div>
    </div>
  )
}

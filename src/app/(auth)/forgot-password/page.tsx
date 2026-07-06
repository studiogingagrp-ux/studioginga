'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function enviar() {
    if (!email.trim()) { toast.error('Informe seu e-mail.'); return }
    if (!isSupabaseConfigured()) { toast.error('Indisponível no modo demo.'); return }
    setLoading(true)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/definir-senha`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    setLoading(false)
    if (error) { toast.error('Não foi possível enviar o link.', { description: error.message }); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="animate-rise text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15"><MailCheck className="size-6 text-emerald-400" /></span>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">Link enviado!</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Enviamos um link para <b className="text-foreground">{email}</b> definir a senha. Confira a caixa de entrada e o <b>spam</b>.</p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
          <ArrowLeft className="size-4" /> Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-rise">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">Recuperar acesso</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Informe seu e-mail e enviaremos um link para definir a senha.</p>
      <div className="mt-8 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') enviar() }}
          placeholder="voce@email.com"
          className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-brand/40"
        />
        <button
          onClick={enviar}
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Enviar link'}
        </button>
      </div>
      <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="size-4" /> Voltar para o login
      </Link>
    </div>
  )
}

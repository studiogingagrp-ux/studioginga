'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function DefinirSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function salvar() {
    if (password.length < 6) { toast.error('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { toast.error('As senhas não coincidem.'); return }
    if (!isSupabaseConfigured()) { toast.error('Login indisponível no modo demo.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Link expirado. Peça um novo link de acesso.')
      setLoading(false)
      router.replace('/forgot-password')
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error('Não foi possível salvar a senha.', { description: error.message })
      setLoading(false)
      return
    }
    toast.success('Senha definida! Bem-vindo. 🎉')
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <div className="animate-rise">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
        <KeyRound className="size-3.5" /> Criar sua senha
      </span>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">Defina sua senha de acesso</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Escolha uma senha para entrar no Ginga Studio. Você já fica logado.</p>

      <div className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nova senha</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-11 w-full rounded-xl border border-input bg-card px-3.5 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/40"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirmar senha</label>
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') salvar() }}
            placeholder="Repita a senha"
            className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <button
          onClick={salvar}
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <><CheckCircle2 className="size-4" /> Salvar e entrar</>}
        </button>
      </div>
    </div>
  )
}

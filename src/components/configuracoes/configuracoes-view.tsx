'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Palette, Check, Building2, KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/brand/logo'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { saveWorkspaceBranding } from '@/lib/actions/branding'

const SWATCHES = ['#f2b23e', '#f0722a', '#e0245e', '#8b5cf6', '#0ea5e9', '#22c55e', '#eab308', '#ef4444']

function darken(hex: string, amount = 0.16) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((n >> 16) & 255) * (1 - amount))
  const g = Math.max(0, ((n >> 8) & 255) * (1 - amount))
  const b = Math.max(0, (n & 255) * (1 - amount))
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

export function ConfiguracoesView({ initialName, initialColor, isRealData, isDono = true }: { initialName?: string; initialColor?: string; isRealData?: boolean; isDono?: boolean } = {}) {
  const [name, setName] = useState(initialName || 'Ginga Studio')
  const [color, setColor] = useState(initialColor || '#f2b23e')
  const [saving, startSave] = useTransition()

  function salvar() {
    if (!isRealData) { toast.success('Configurações salvas!'); return }
    startSave(async () => {
      const res = await saveWorkspaceBranding({ name: name.trim(), brand_color: color })
      if (res.error) toast.error(res.error)
      else toast.success('Configurações salvas! 💾')
    })
  }

  function applyColor(hex: string) {
    setColor(hex)
    const root = document.documentElement
    root.style.setProperty('--brand', hex)
    root.style.setProperty('--brand-button', hex)
    root.style.setProperty('--brand-secondary', darken(hex, 0.22))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="kicker text-brand">Configurações</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">
          {isDono ? 'Personalização' : 'Minha conta'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isDono ? 'Deixe o sistema com a cara da agência — muda na hora, em todo o sistema.' : 'Gerencie os dados da sua conta.'}
        </p>
      </header>

      {/* Marca — só o dono edita */}
      {isDono && (
        <Section icon={Palette} title="Identidade da marca" sub="White-label">
          <Field label="Nome da agência">
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
          </Field>

          <Field label="Cor principal">
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((s) => (
                <button key={s} onClick={() => applyColor(s)} className={cn('size-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110', color.toLowerCase() === s ? 'ring-white/70' : 'ring-transparent')} style={{ backgroundColor: s }} aria-label={s}>
                  {color.toLowerCase() === s && <Check className="mx-auto size-4 text-black" />}
                </button>
              ))}
              <label className="ml-1 inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 text-xs text-muted-foreground">
                <input type="color" value={color} onChange={(e) => applyColor(e.target.value)} className="size-4 cursor-pointer border-0 bg-transparent p-0" />
                {color.toUpperCase()}
              </label>
            </div>
          </Field>

          <Field label="Logo">
            <div className="flex items-center gap-3">
              <LogoMark className="size-12" />
              <p className="text-xs text-muted-foreground">Quer a sua logo aqui? Envie o arquivo pra GRP Tecnologia que a gente aplica no sistema.</p>
            </div>
          </Field>

          {/* Preview ao vivo */}
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="kicker mb-3 text-muted-foreground/50">Prévia ao vivo</p>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold">
                <Building2 className="size-4" /> {name || 'Sua agência'}
              </button>
              <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand">Etiqueta da marca</span>
              <span className="font-display text-lg font-extrabold text-brand">Aa</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={salvar} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-6 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4" /> Salvar alterações</>}
            </button>
          </div>
        </Section>
      )}

      {/* Segurança — trocar senha (todos os papéis) */}
      <Section icon={ShieldCheck} title="Segurança" sub="Sua conta">
        <TrocarSenha />
      </Section>
    </div>
  )
}

function TrocarSenha() {
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function salvar() {
    if (senha.length < 6) { toast.error('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senha !== confirma) { toast.error('As senhas não coincidem.'); return }
    if (!isSupabaseConfigured()) { toast.error('Indisponível no modo demo.'); return }
    setLoading(true)
    const { error } = await createClient().auth.updateUser({ password: senha })
    setLoading(false)
    if (error) { toast.error('Não foi possível trocar a senha.', { description: error.message }); return }
    toast.success('Senha atualizada! 🔒')
    setSenha(''); setConfirma('')
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">Troque sua senha de acesso quando quiser. Você continua logado.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nova senha">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-11 w-full rounded-xl border border-input bg-background px-3.5 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirmar nova senha">
          <input
            type={show ? 'text' : 'password'} value={confirma} onChange={(e) => setConfirma(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') salvar() }}
            placeholder="Repita a senha"
            className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
          />
        </Field>
      </div>
      <button
        onClick={salvar}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <><KeyRound className="size-4" /> Trocar senha</>}
      </button>
    </>
  )
}

function Section({ icon: Icon, title, sub, children }: { icon: typeof Palette; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-secondary text-brand"><Icon className="size-[18px]" /></span>
        <div>
          <p className="kicker text-muted-foreground/50">{sub}</p>
          <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

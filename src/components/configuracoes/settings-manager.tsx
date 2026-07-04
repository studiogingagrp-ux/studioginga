'use client'

import { useState, useRef, useTransition } from 'react'
import {
  Building2, Palette, MessageCircle, DoorOpen, Plus, Check, QrCode, Trash2,
  Upload, X, ImageIcon, CreditCard, Zap, ShieldCheck, CalendarDays,
  ExternalLink, Loader2, CheckCircle2, AlertCircle, Globe, Type,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { brandVars, darkenHex, DEFAULT_BRAND, type WorkspaceBranding, type WorkspaceSettings } from '@/lib/branding'
import { saveWorkspaceBranding } from '@/lib/actions/branding'
import { PageHeader } from '@/components/layout/page-header'

type Tab = 'workspacea' | 'marca' | 'whatsapp' | 'recursos' | 'assinatura'
const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'workspacea',     label: 'Empresa',             icon: Building2 },
  { id: 'marca',       label: 'Identidade visual',   icon: Palette },
  { id: 'whatsapp',    label: 'WhatsApp',             icon: MessageCircle },
  { id: 'recursos',    label: 'Salas e equipamentos', icon: DoorOpen },
  { id: 'assinatura',  label: 'Assinatura',           icon: CreditCard },
]

const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'

const PRESETS: { hex: string; label: string }[] = [
  { hex: '#b08d4e', label: 'Dourado Fosco' },
  { hex: '#c9963b', label: 'Âmbar' },
  { hex: '#d97706', label: 'Cobre' },
  { hex: '#be123c', label: 'Carmim' },
  { hex: '#9d174d', label: 'Rosé' },
  { hex: '#7c3aed', label: 'Ametista' },
  { hex: '#1e40af', label: 'Safira' },
  { hex: '#0369a1', label: 'Cerúleo' },
  { hex: '#0f766e', label: 'Esmeralda' },
  { hex: '#16a34a', label: 'Jade' },
  { hex: '#dc2626', label: 'Rubi' },
  { hex: '#334155', label: 'Grafite' },
]

interface SettingsManagerProps {
  initialBranding?: WorkspaceBranding | null
}

export function SettingsManager({ initialBranding }: SettingsManagerProps) {
  const [tab, setTab] = useState<Tab>('workspacea')

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Configurações" subtitle="Personalize a plataforma da sua empresa" />
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-secondary',
              )}>
              <t.icon className={cn('size-4', tab === t.id && 'text-brand')} />
              {t.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === 'workspacea'    && <WorkspaceTab />}
          {tab === 'marca'      && <BrandTab initialBranding={initialBranding} />}
          {tab === 'whatsapp'   && <WhatsappTab />}
          {tab === 'recursos'   && <ResourcesTab />}
          {tab === 'assinatura' && <SubscriptionTab />}
        </div>
      </div>
    </div>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
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

/* ────────────────── Empresa ────────────────── */
function WorkspaceTab() {
  return (
    <Panel title="Dados da empresa">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome"><input defaultValue="Atlas Agenda Center" className={inputCls} /></Field>
        <Field label="CNPJ"><input defaultValue="12.345.678/0001-90" className={inputCls} /></Field>
        <Field label="Telefone"><input defaultValue="(11) 3000-0000" className={inputCls} /></Field>
        <Field label="WhatsApp"><input defaultValue="(11) 99999-0000" className={inputCls} /></Field>
        <div className="sm:col-span-2">
          <Field label="Endereço"><input defaultValue="Av. Paulista, 1000 · São Paulo/SP" className={inputCls} /></Field>
        </div>
      </div>
      <button onClick={() => toast.success('Dados salvos')}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95">
        <Check className="size-4" /> Salvar
      </button>
    </Panel>
  )
}

/* ────────────────── Identidade visual ────────────────── */
function BrandTab({ initialBranding }: { initialBranding?: WorkspaceBranding | null }) {
  const s = initialBranding?.settings as WorkspaceSettings | undefined

  const [color,        setColor]        = useState(initialBranding?.brand_color ?? DEFAULT_BRAND)
  const [secondary,    setSecondary]    = useState(s?.brand_secondary ?? '')
  const [logoSrc,      setLogoSrc]      = useState<string | null>(initialBranding?.logo_url ?? null)
  const [logoName,     setLogoName]     = useState('')
  const [workspaceName,   setWorkspaceName]   = useState(initialBranding?.name ?? '')
  const [tagline,      setTagline]      = useState(s?.tagline ?? '')
  const [welcomeText,  setWelcomeText]  = useState(s?.welcome_text ?? '')
  const [loginImgSrc,  setLoginImgSrc]  = useState<string | null>(s?.login_image_url ?? null)
  const [sideImgSrc,   setSideImgSrc]   = useState<string | null>(s?.sidebar_image_url ?? null)
  const [footerText,   setFooterText]   = useState(s?.footer_text ?? '')
  const [isPending,    startTransition] = useTransition()

  const fileRef     = useRef<HTMLInputElement>(null)
  const loginImgRef = useRef<HTMLInputElement>(null)
  const sideImgRef  = useRef<HTMLInputElement>(null)

  const effectiveSecondary = secondary || darkenHex(color)

  function applyColor(c: string) {
    setColor(c)
    Object.entries(brandVars({ brand_color: c, settings: { brand_secondary: secondary || undefined } }))
      .forEach(([k, v]) => document.documentElement.style.setProperty(k, v))
  }

  function readFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setFn: (src: string) => void,
    setName?: (n: string) => void,
    ref?: React.RefObject<HTMLInputElement | null>,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { toast.error('Arquivo muito grande — máximo 4 MB.'); return }
    setName?.(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => setFn(ev.target?.result as string)
    reader.readAsDataURL(file)
    if (ref?.current) ref.current.value = ''
  }

  async function handleSave() {
    startTransition(async () => {
      const result = await saveWorkspaceBranding({
        name:        workspaceName || undefined,
        brand_color: color,
        logo_url:    logoSrc ?? undefined,
        settings: {
          tagline:           tagline || undefined,
          welcome_text:      welcomeText || undefined,
          brand_secondary:   secondary || undefined,
          login_image_url:   loginImgSrc ?? undefined,
          sidebar_image_url: sideImgSrc ?? undefined,
          footer_text:       footerText || undefined,
        },
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Identidade visual salva!')
        // Aplica a cor imediatamente no CSS
        Object.entries(brandVars({ brand_color: color, settings: { brand_secondary: secondary || undefined } }))
          .forEach(([k, v]) => document.documentElement.style.setProperty(k, v))
      }
    })
  }

  return (
    <div className="space-y-5">

      {/* ── Seção 1: Logo e Nome ── */}
      <Panel title="Logo e nome" subtitle="Aparece no cabeçalho, portais e tela de login.">
        {/* Upload de logo */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/40">
            {logoSrc
              ? <img src={logoSrc} alt="Logo" className="size-full object-contain p-2" />
              : <ImageIcon className="size-8 text-muted-foreground/40" />
            }
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 text-sm text-foreground transition-colors hover:bg-secondary">
                <Upload className="size-4" />
                {logoSrc ? 'Trocar logo' : 'Enviar logo'}
                <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  onChange={(e) => readFile(e, setLogoSrc, setLogoName, fileRef)}
                  className="sr-only" />
              </label>
              {logoSrc && (
                <button onClick={() => { setLogoSrc(null); setLogoName('') }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm text-destructive transition-colors hover:bg-destructive/5">
                  <X className="size-4" /> Remover
                </button>
              )}
            </div>
            {logoName && <p className="text-xs text-muted-foreground">Arquivo: {logoName}</p>}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              PNG, SVG ou WEBP · até 4 MB · fundo transparente recomendado
            </p>
          </div>
        </div>

        {logoSrc && (
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-4 py-3">
              <img src={logoSrc} alt="" className="h-8 max-w-[120px] object-contain" />
              <span className="text-[11px] text-muted-foreground">Claro</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-zinc-900 px-4 py-3">
              <img src={logoSrc} alt="" className="h-8 max-w-[120px] object-contain" />
              <span className="text-[11px] text-white/50">Escuro</span>
            </div>
          </div>
        )}

        {/* Textos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da empresa">
            <div className="relative">
              <Type className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Atlas Agenda Center"
                className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </Field>
          <Field label="Tagline / função">
            <input value={tagline} onChange={(e) => setTagline(e.target.value)}
              placeholder="Sua equipe · Uma visão só"
              className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Texto de boas-vindas (tela de login)">
              <input value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)}
                placeholder="Bem-vindo à Atlas Agenda Center"
                className={inputCls} />
            </Field>
          </div>
        </div>
      </Panel>

      {/* ── Seção 2: Cores ── */}
      <Panel title="Cores" subtitle="A interface inteira se adapta ao escolher uma cor. Visualize em tempo real.">
        <div className="grid gap-2">
          <div className="grid grid-cols-6 gap-2">
            {PRESETS.map((p) => (
              <button key={p.hex} onClick={() => applyColor(p.hex)} title={p.label}
                className={cn(
                  'group flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all hover:bg-secondary',
                  color === p.hex && 'bg-secondary ring-1 ring-border',
                )}>
                <span className={cn(
                  'size-8 rounded-lg shadow-sm transition-transform group-hover:scale-110',
                  color === p.hex && 'scale-110 ring-2 ring-offset-2',
                )}
                  style={{ backgroundColor: p.hex, '--tw-ring-color': p.hex } as React.CSSProperties} />
                <span className="text-[10px] leading-none text-muted-foreground">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary">
              <input type="color" value={color} onChange={(e) => applyColor(e.target.value)}
                className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
              Cor principal
            </label>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary">
              <input type="color" value={secondary || darkenHex(color)}
                onChange={(e) => setSecondary(e.target.value)}
                className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
              Cor secundária
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <span className="size-4 rounded" style={{ backgroundColor: color }} />
              <span className="font-mono text-sm text-foreground">{color.toUpperCase()}</span>
            </div>
            {color !== DEFAULT_BRAND && (
              <button onClick={() => { applyColor(DEFAULT_BRAND); setSecondary('') }}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-brand">
                Restaurar padrão
              </button>
            )}
          </div>

          <div className="mt-1 h-3 w-full overflow-hidden rounded-xl"
            style={{ background: `linear-gradient(135deg, ${color}, ${effectiveSecondary})` }} />
        </div>

        {/* Preview da interface */}
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background">
          <div className="flex h-10 items-center justify-between border-b border-border bg-background px-3">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded" style={{ background: `linear-gradient(135deg, ${color}, ${effectiveSecondary})` }} />
              <span className="text-xs font-semibold text-foreground">{workspaceName || 'Atlas Agenda Center'}</span>
            </div>
            <div className="flex gap-1">
              <span className="size-2.5 rounded-full" style={{ background: `linear-gradient(135deg, ${color}, ${effectiveSecondary})` }} />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
          </div>
          <div className="flex gap-3 p-3">
            <div className="w-20 shrink-0 space-y-1 rounded-lg bg-secondary/60 p-2">
              {['Agenda', 'Clientes', 'WhatsApp'].map((l, i) => (
                <div key={l} className="flex items-center gap-1 rounded-md px-1.5 py-1">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: i === 0 ? color : 'transparent' }} />
                  <span className="text-[9px] text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                {['Hoje', 'Semana', 'Mês'].map((l, i) => (
                  <span key={l} className={cn('rounded-md px-2 py-0.5 text-[9px] font-medium', i !== 0 && 'bg-secondary text-muted-foreground')}
                    style={i === 0 ? { background: `linear-gradient(135deg, ${color}, ${effectiveSecondary})`, color: '#fff' } : {}}>
                    {l}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {['28', '94%', 'R$8k'].map((v) => (
                  <div key={v} className="rounded-lg border border-border bg-card p-1.5 text-center">
                    <p className="text-[10px] font-bold" style={{ color }}>{v}</p>
                    <p className="text-[8px] text-muted-foreground">métrica</p>
                  </div>
                ))}
              </div>
              <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${color}, ${effectiveSecondary})` }}>
                + Novo agendamento
              </button>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Seção 3: Imagens ── */}
      <Panel title="Imagens e rodapé" subtitle="Personaliza a tela de login e outros elementos visuais.">
        <div className="space-y-4">
          <ImageUploadField
            label="Imagem de login (painel esquerdo)"
            hint="Foto da empresa, equipe ou procedimento. Proporção 4:3 ou retrato."
            src={loginImgSrc}
            onUpload={(e) => readFile(e, setLoginImgSrc, undefined, loginImgRef)}
            onRemove={() => setLoginImgSrc(null)}
            inputRef={loginImgRef}
          />
          <ImageUploadField
            label="Imagem lateral / sidebar"
            hint="Opcional. Usada em telas especiais e futuras expansões."
            src={sideImgSrc}
            onUpload={(e) => readFile(e, setSideImgSrc, undefined, sideImgRef)}
            onRemove={() => setSideImgSrc(null)}
            inputRef={sideImgRef}
          />
          <Field label="Texto do rodapé">
            <input value={footerText} onChange={(e) => setFooterText(e.target.value)}
              placeholder="© 2026 Atlas Agenda Center · Todos os direitos reservados"
              className={inputCls} />
          </Field>
        </div>
      </Panel>

      {/* ── Seção 4: Avançado ── */}
      <Panel title="Avançado">
        <div className="space-y-4">
          <Field label="Domínio personalizado">
            <div className="relative">
              <Globe className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input disabled placeholder="agenda.suaempresa.com.br"
                className="h-11 w-full rounded-xl border border-input bg-secondary/30 pl-9 pr-3.5 text-sm text-muted-foreground outline-none cursor-not-allowed" />
              <span className="absolute right-3 top-2.5 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Em breve
              </span>
            </div>
          </Field>
          <p className="text-xs text-muted-foreground">
            Configuração de subdomínio e SSL estará disponível nos próximos meses.
          </p>
        </div>
      </Panel>

      {/* Salvar tudo */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-60"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Salvar identidade visual
      </button>
    </div>
  )
}

function ImageUploadField({
  label, hint, src, onUpload, onRemove, inputRef,
}: {
  label: string
  hint: string
  src: string | null
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-start gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-secondary/40">
          {src
            ? <img src={src} alt="" className="size-full object-cover" />
            : <ImageIcon className="size-6 text-muted-foreground/40" />
          }
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 text-sm text-foreground transition-colors hover:bg-secondary">
              <Upload className="size-4" />
              {src ? 'Trocar' : 'Enviar'}
              <input ref={inputRef} type="file" accept="image/*" onChange={onUpload} className="sr-only" />
            </label>
            {src && (
              <button onClick={onRemove}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-sm text-destructive hover:bg-destructive/5">
                <X className="size-4" /> Remover
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  )
}

/* ────────────────── WhatsApp ────────────────── */
function WhatsappTab() {
  const [connected, setConnected] = useState(false)
  return (
    <Panel title="Conexão do WhatsApp">
      {connected ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Check className="size-7" />
          </span>
          <p className="mt-4 font-medium text-foreground">WhatsApp conectado</p>
          <p className="text-sm text-muted-foreground">
            Instância <span className="font-mono">atlas_estevam</span> · número (11) 99999-0000
          </p>
          <button onClick={() => setConnected(false)}
            className="mt-4 rounded-xl border border-border px-4 py-2 text-sm text-destructive hover:bg-destructive/5">
            Desconectar
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="grid size-44 place-items-center rounded-2xl border-2 border-dashed border-border bg-secondary/40 text-muted-foreground">
            <QrCode className="size-16" />
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Abra o WhatsApp no celular → Aparelhos conectados → Conectar aparelho e escaneie o QR Code.
          </p>
          <button onClick={() => { setConnected(true); toast.success('WhatsApp conectado!') }}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95">
            <MessageCircle className="size-4" /> Gerar QR Code
          </button>
        </div>
      )}
    </Panel>
  )
}

/* ────────────────── Salas e equipamentos ────────────────── */
function ResourcesTab() {
  const [rooms, setRooms] = useState(['Sala de reunião', 'Studio de gravação', 'Sala de edição'])
  const [equip, setEquip] = useState(['Laser CO2', 'Luz intensa pulsada', 'Criolipólise'])
  const [nr, setNr] = useState('')
  const [ne, setNe] = useState('')
  return (
    <div className="space-y-6">
      <Panel title="Salas">
        <List items={rooms} onRemove={(i) => setRooms((r) => r.filter((_, x) => x !== i))} />
        <AddRow value={nr} setValue={setNr} placeholder="Nova sala…"
          onAdd={() => { if (nr.trim()) { setRooms((r) => [...r, nr.trim()]); setNr('') } }} />
      </Panel>
      <Panel title="Equipamentos">
        <List items={equip} onRemove={(i) => setEquip((e) => e.filter((_, x) => x !== i))} />
        <AddRow value={ne} setValue={setNe} placeholder="Novo equipamento…"
          onAdd={() => { if (ne.trim()) { setEquip((e) => [...e, ne.trim()]); setNe('') } }} />
      </Panel>
    </div>
  )
}

function List({ items, onRemove }: { items: string[]; onRemove: (i: number) => void }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5 text-sm">
          {it}
          <button onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
function AddRow({ value, setValue, placeholder, onAdd }: {
  value: string; setValue: (v: string) => void; placeholder: string; onAdd: () => void
}) {
  return (
    <div className="mt-3 flex gap-2">
      <input value={value} onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        placeholder={placeholder} className={inputCls} />
      <button onClick={onAdd}
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-soft">
        <Plus className="size-4" />
      </button>
    </div>
  )
}

/* ────────────────── Assinatura ────────────────── */

type SubStatus = 'trial' | 'active' | 'overdue' | 'inactive'

const STATUS_META: Record<SubStatus, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  trial:    { label: 'Trial',    color: 'text-amber-700',   bg: 'bg-amber-50',   icon: Zap },
  active:   { label: 'Ativa',   color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  overdue:  { label: 'Vencida', color: 'text-rose-700',    bg: 'bg-rose-50',    icon: AlertCircle },
  inactive: { label: 'Inativa', color: 'text-muted-foreground', bg: 'bg-secondary', icon: X },
}

const PLAN_FEATURES = [
  'Agenda inteligente — drag, drop e redimensionar',
  'WhatsApp Business integrado (Evolution API)',
  'Portal do Membro + Portal do Cliente',
  'Automações de confirmação, retorno e NPS',
  'Relatórios e indicadores em tempo real',
  'Centro de Conhecimento e suporte prioritário',
  'Multi-usuário (dono, equipe, membro)',
  'PWA — acesso pelo celular sem instalar app',
]

const DEMO_INVOICES = [
  { date: '27/06/2026', value: 'R$ 349,00', status: 'Pago',     method: 'PIX' },
  { date: '27/05/2026', value: 'R$ 349,00', status: 'Pago',     method: 'Boleto' },
  { date: '27/04/2026', value: 'R$ 349,00', status: 'Pago',     method: 'PIX' },
]

function SubscriptionTab() {
  const [status] = useState<SubStatus>('trial')
  const [loading, setLoading] = useState(false)
  const M = STATUS_META[status]
  const Icon = M.icon

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/asaas/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Atlas Agenda Center',
          cnpj: '12.345.678/0001-90',
          email: 'financeiro@atlasagenda.center',
          phone: '(11) 3000-0000',
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao criar assinatura.')
        return
      }
      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank')
      } else {
        toast.success('Assinatura criada! Acesse o e-mail para pagar.')
      }
    } catch {
      toast.error('Não foi possível conectar ao gateway de pagamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Card do plano */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="bg-brand-gradient px-6 py-5 text-brand-foreground">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest opacity-80">Plano atual</p>
              <p className="mt-1 font-heading text-2xl font-bold">Premium</p>
              <p className="mt-0.5 text-sm opacity-80">Gestão Atlas Agenda Center</p>
            </div>
            <div className="text-right">
              <p className="font-heading text-3xl font-bold">R$ 349</p>
              <p className="text-xs opacity-70">/mês</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Status badge */}
          <div className={cn('mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium', M.bg, M.color)}>
            <Icon className="size-4" />
            {M.label}
            {status === 'trial' && (
              <span className="ml-1 opacity-70">· expira em 7 dias</span>
            )}
          </div>

          {/* Próximo vencimento */}
          <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            {status === 'active'
              ? 'Próximo vencimento: 27 de julho de 2026'
              : status === 'trial'
              ? 'Ative sua assinatura antes de 04/07/2026 para não perder o acesso'
              : 'Renove sua assinatura para recuperar o acesso'}
          </div>

          {/* Features */}
          <ul className="mb-5 grid gap-2 sm:grid-cols-2">
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          {status !== 'active' && (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {loading
                ? <><Loader2 className="size-4 animate-spin" /> Aguardando…</>
                : <><Zap className="size-4" /> Ativar assinatura — R$ 349/mês</>
              }
            </button>
          )}
          {status === 'active' && (
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm text-muted-foreground hover:bg-secondary">
                <ExternalLink className="size-4" /> Portal de faturamento
              </button>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm text-muted-foreground hover:bg-secondary">
                Cancelar assinatura
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de faturas */}
      <Panel title="Histórico de faturas">
        {status === 'trial' ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma fatura gerada ainda.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Data</th>
                  <th className="px-4 py-3 text-left font-medium">Valor</th>
                  <th className="px-4 py-3 text-left font-medium">Forma</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_INVOICES.map((inv, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 text-foreground">{inv.date}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{inv.value}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.method}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="size-3" /> {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Info gateway */}
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-secondary/30 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Pagamento seguro via Asaas</p>
          PIX, boleto bancário ou cartão de crédito. Cobrado mensalmente no mesmo dia. Cancele quando quiser, sem multa.
        </div>
      </div>
    </div>
  )
}

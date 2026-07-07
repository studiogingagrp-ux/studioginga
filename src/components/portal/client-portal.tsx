'use client'

import { useState, useTransition } from 'react'
import { Check, RotateCcw, MessageSquare, CalendarClock, FolderKanban, Sparkles, ShieldCheck, Send, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/brand/logo'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { APPROVAL_TYPE_META, PREVIEW_GRADIENT, PROJECT_STATUS_META } from '@/lib/demo/agency'
import { portalActOnApproval } from '@/lib/actions/portal'
import type { ApprovalStatus, ApprovalType, ProjectStatus } from '@/types/database'

const KIND: Record<string, string> = { reuniao: '🤝', entrega: '📦', gravacao: '🎬', call: '📞', interno: '🏢', consulta: '🤝', retorno: '📞' }

export interface PortalApproval {
  id: string; title: string; type: ApprovalType; status: ApprovalStatus
  version: number; caption: string; preview: string; commentsCount: number
}
export interface PortalProject { id: string; name: string; status: ProjectStatus; progress: number }
export interface PortalMeeting { id: string; time: string; title: string; kind: string }

export function ClientPortal({ clientId, clientName, contactName, agency, agencyPhone, projects, approvals: initialApprovals, meetings, isRealData }: {
  clientId: string
  clientName: string
  contactName: string
  agency: string
  agencyPhone?: string | null
  projects: PortalProject[]
  approvals: PortalApproval[]
  meetings: PortalMeeting[]
  isRealData?: boolean
}) {
  const [approvals, setApprovals] = useState(initialApprovals)
  const [pending, start] = useTransition()
  const pendentes = approvals.filter((a) => ['enviado', 'reenviado', 'alteracao'].includes(a.status))
  const ativos = projects.filter((p) => !['finalizado', 'pausado'].includes(p.status))

  const [commentFor, setCommentFor] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  function act(id: string, status: 'aprovado' | 'alteracao', comment?: string) {
    const apply = () => {
      setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
      setCommentFor(null); setCommentText('')
      toast.success(status === 'aprovado' ? 'Obrigado! Material aprovado 🎉' : 'Pedido de alteração enviado à equipe ✅')
    }
    if (!isRealData) { apply(); return }
    start(async () => {
      const res = await portalActOnApproval({ clientId, approvalId: id, action: status, comment, authorName: contactName })
      if (res.error) { toast.error(res.error); return }
      apply()
    })
  }

  return (
    <div className="ginga-grain relative min-h-screen bg-background">
      <div aria-hidden className="ginga-glow pointer-events-none fixed inset-0 opacity-60" />

      {/* Topo */}
      <header className="relative z-10 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div className="leading-none">
              <p className="font-display text-[15px] font-extrabold text-foreground">{agency}</p>
              <p className="kicker mt-1 text-muted-foreground">Portal do cliente</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <ShieldCheck className="size-3.5" /> Acesso seguro
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl space-y-8 px-5 py-8">
        {/* Hero */}
        <section>
          <p className="kicker text-brand">Bem-vindo, {contactName.split(' ')[0]}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {clientName}
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Aqui você acompanha tudo da sua conta com a {agency}: projetos em andamento, materiais para aprovar e as próximas reuniões — em um lugar só.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat icon={FolderKanban} label="Projetos ativos" value={String(ativos.length)} />
            <Stat icon={Check} label="Aguardando você" value={String(pendentes.length)} tone={pendentes.length ? 'text-amber-300' : 'text-emerald-300'} />
            <Stat icon={CalendarClock} label="Próxima reunião" value={meetings[0]?.time ?? '—'} />
          </div>
        </section>

        {/* Aguardando aprovação — o coração do portal */}
        {pendentes.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              <h2 className="font-display text-lg font-bold text-foreground">Aguardando sua aprovação</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {pendentes.map((a) => {
                const type = APPROVAL_TYPE_META[a.type] ?? APPROVAL_TYPE_META.arte
                const grad = PREVIEW_GRADIENT[a.preview] ?? PREVIEW_GRADIENT.gold
                return (
                  <div key={a.id} className="overflow-hidden rounded-2xl border border-brand/25 bg-card shadow-card">
                    <div className={cn('relative flex h-40 items-center justify-center bg-gradient-to-br', grad)}>
                      <span className="text-5xl opacity-90 drop-shadow">{type.emoji}</span>
                      <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">v{a.version}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                      {a.caption && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{a.caption}</p>}
                      {a.commentsCount > 0 && (
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><MessageSquare className="size-3" /> {a.commentsCount} comentário(s)</p>
                      )}
                      {commentFor === a.id ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            autoFocus value={commentText} onChange={(e) => setCommentText(e.target.value)}
                            rows={2} placeholder="Descreva o ajuste que você quer…"
                            className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <button disabled={pending} onClick={() => act(a.id, 'alteracao', commentText)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60">
                              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Enviar ajuste
                            </button>
                            <button onClick={() => { setCommentFor(null); setCommentText('') }} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-secondary text-sm font-medium text-muted-foreground hover:bg-white/10">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button disabled={pending} onClick={() => act(a.id, 'aprovado')} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60">
                            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Aprovar
                          </button>
                          <button onClick={() => { setCommentFor(a.id); setCommentText('') }} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-white/10">
                            <RotateCcw className="size-4" /> Pedir ajuste
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Projetos */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">Seus projetos</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <ul className="divide-y divide-border">
              {projects.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">Nenhum projeto por aqui ainda.</li>}
              {projects.map((p) => {
                const meta = PROJECT_STATUS_META[p.status] ?? PROJECT_STATUS_META.producao
                return (
                  <li key={p.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="w-9 text-right font-mono text-[11px] text-muted-foreground tabular">{p.progress}%</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* Reuniões + contato */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-foreground">Próximas reuniões</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <ul className="divide-y divide-border">
                {meetings.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">Nenhuma reunião agendada.</li>}
                {meetings.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="w-12 font-mono text-sm font-semibold text-brand tabular">{m.time}</span>
                    <span>{KIND[m.kind] ?? '🗓️'}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{m.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-foreground">Fale com a {agency}</h2>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Precisa de algo além das aprovações? Fale direto com a equipe — respondemos rapidinho.
              </p>
              {agencyPhone ? (
                <a
                  href={`https://wa.me/${agencyPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Sou ${contactName} (${clientName}) — vim pelo portal.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-black transition-transform hover:scale-[1.01] active:scale-95"
                >
                  <MessageCircle className="size-4" /> Chamar no WhatsApp
                </a>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground/70">Use o WhatsApp de sempre com a equipe. 💛</p>
              )}
            </div>
          </div>
        </section>

        <p className="pt-2 text-center text-[11px] text-muted-foreground/50">
          Portal do cliente · {agency} · desenvolvido por GRP Tecnologia
        </p>
      </main>
      <InstallPrompt />
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone = 'text-foreground' }: { icon: typeof Check; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="kicker">{label}</span>
      </div>
      <p className={cn('mt-2 font-display text-2xl font-extrabold tabular', tone)}>{value}</p>
    </div>
  )
}

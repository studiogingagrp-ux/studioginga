'use client'

import { useMemo, useState } from 'react'
import {
  FileText, Plus, Sparkles, Copy, MessageCircle, Trash2, Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GINGA_CLIENTS, mx, clientOf } from '@/lib/demo/agency'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

interface Item { s: string; v: number }
interface Template { id: string; name: string; emoji: string; desc: string; items: Item[]; intro: string }

const TEMPLATES: Template[] = [
  { id: 'social', name: 'Gestão de Social Media', emoji: '📱', desc: 'Conteúdo, posts e stories no mês.',
    intro: 'Proposta para gestão completa das redes sociais, com planejamento estratégico e produção de conteúdo mensal.',
    items: [{ s: 'Planejamento de conteúdo', v: 8000 }, { s: 'Criação de posts (12/mês)', v: 9000 }, { s: 'Stories e reels (8/mês)', v: 7000 }] },
  { id: 'trafego', name: 'Tráfego Pago (Performance)', emoji: '🎯', desc: 'Campanhas Meta e Google Ads.',
    intro: 'Proposta de gestão de tráfego pago focada em performance e retorno sobre o investimento.',
    items: [{ s: 'Gestão de campanhas Meta Ads', v: 12000 }, { s: 'Google Ads', v: 8000 }, { s: 'Relatórios quinzenais', v: 3000 }] },
  { id: 'branding', name: 'Branding / Identidade Visual', emoji: '🎨', desc: 'Marca do zero ao manual.',
    intro: 'Proposta para construção completa da identidade da marca, do conceito às aplicações.',
    items: [{ s: 'Naming e conceito', v: 15000 }, { s: 'Logo e identidade visual', v: 20000 }, { s: 'Manual de marca', v: 10000 }] },
  { id: 'site', name: 'Site / Landing Page', emoji: '💻', desc: 'Design + desenvolvimento + SEO.',
    intro: 'Proposta para criação de site profissional, com foco em conversão e presença digital.',
    items: [{ s: 'Design UX/UI', v: 12000 }, { s: 'Desenvolvimento', v: 18000 }, { s: 'SEO inicial', v: 5000 }] },
  { id: 'audiovisual', name: 'Audiovisual', emoji: '🎬', desc: 'Roteiro, gravação e edição.',
    intro: 'Proposta de produção audiovisual para fortalecer a marca com vídeos de alto impacto.',
    items: [{ s: 'Roteiro e pré-produção', v: 4000 }, { s: 'Gravação (1 diária)', v: 9000 }, { s: 'Edição e finalização', v: 8000 }] },
  { id: 'completo', name: 'Pacote Completo 360°', emoji: '⭐', desc: 'Tudo junto, a agência inteira.',
    intro: 'Proposta 360°: a Ginga Studio como parceira de marketing completa da sua marca.',
    items: [{ s: 'Social media', v: 18000 }, { s: 'Tráfego pago', v: 15000 }, { s: 'Audiovisual', v: 12000 }, { s: 'Estratégia e relatórios', v: 5000 }] },
]

const CONTRACTS: { id: string; name: string; emoji: string; desc: string }[] = [
  { id: 'servicos', name: 'Prestação de Serviços de Marketing', emoji: '📄', desc: 'O contrato principal de escopo, prazo e valor.' },
  { id: 'retainer', name: 'Contrato Retainer (mensal)', emoji: '🔁', desc: 'Recorrência mensal com renovação automática.' },
  { id: 'nda', name: 'Termo de Confidencialidade (NDA)', emoji: '🔒', desc: 'Protege as informações do cliente e da agência.' },
  { id: 'imagem', name: 'Cessão de Direitos de Imagem', emoji: '📸', desc: 'Autorização de uso de imagem e conteúdo.' },
]

const STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  rascunho: { label: 'Rascunho', chip: 'bg-zinc-500/15 text-zinc-300', dot: 'bg-zinc-400' },
  enviada:  { label: 'Enviada',  chip: 'bg-sky-500/15 text-sky-300',   dot: 'bg-sky-400' },
  aceita:   { label: 'Aceita',   chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
  recusada: { label: 'Recusada', chip: 'bg-rose-500/15 text-rose-300', dot: 'bg-rose-400' },
}

interface Proposta { id: string; clientId: string; templateName: string; value: number; status: keyof typeof STATUS; at: string }
const SEED: Proposta[] = [
  { id: 'p1', clientId: 'c1', templateName: 'Branding / Identidade Visual', value: 45000, status: 'aceita',   at: '02/07' },
  { id: 'p2', clientId: 'c2', templateName: 'Tráfego Pago (Performance)',   value: 23000, status: 'enviada',  at: '01/07' },
  { id: 'p7', clientId: 'c7', templateName: 'Pacote Completo 360°',         value: 50000, status: 'rascunho', at: 'Hoje' },
]

const uid = () => Math.random().toString(36).slice(2, 9)

export function PropostasView() {
  const [tab, setTab] = useState<'propostas' | 'contratos' | 'templates'>('propostas')
  const [propostas, setPropostas] = useState<Proposta[]>(SEED)
  const [builder, setBuilder] = useState(false)
  const [doc, setDoc] = useState<{ text: string; phone: string } | null>(null)

  // builder form
  const [clientId, setClientId] = useState('c1')
  const [tplId, setTplId] = useState('completo')
  const [items, setItems] = useState<Item[]>(TEMPLATES.find((t) => t.id === 'completo')!.items)
  const [intro, setIntro] = useState(TEMPLATES.find((t) => t.id === 'completo')!.intro)
  const [validity, setValidity] = useState(15)

  const total = useMemo(() => items.reduce((s, i) => s + (Number(i.v) || 0), 0), [items])

  function openBuilder(tid?: string) {
    const t = TEMPLATES.find((x) => x.id === (tid ?? tplId)) ?? TEMPLATES[0]
    setTplId(t.id); setItems(t.items.map((i) => ({ ...i }))); setIntro(t.intro)
    setDoc(null); setBuilder(true)
  }
  function pickTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id)!
    setTplId(id); setItems(t.items.map((i) => ({ ...i }))); setIntro(t.intro)
  }

  function gerar() {
    const c = clientOf(clientId)
    const tpl = TEMPLATES.find((t) => t.id === tplId)!
    const linhas: string[] = []
    linhas.push('*PROPOSTA COMERCIAL — Ginga Studio*')
    linhas.push(`Para: ${c?.name}  (${c?.contact})`)
    linhas.push(`Data: ${new Date().toLocaleDateString('pt-BR')} · válida por ${validity} dias`)
    linhas.push('')
    linhas.push(intro.trim())
    linhas.push('')
    linhas.push('*Escopo & investimento:*')
    items.forEach((i) => linhas.push(`• ${i.s} — ${mx(Number(i.v) || 0)}/mês`))
    linhas.push('')
    linhas.push(`*Investimento total: ${mx(total)}/mês*`)
    linhas.push('')
    linhas.push('Para aprovar, responda *ACEITO* — e já começamos. 🚀')
    linhas.push('_Ginga Studio · marketing que gira resultado._')
    const text = linhas.join('\n')
    setDoc({ text, phone: c?.phone ?? '' })
    setPropostas((prev) => [{ id: uid(), clientId, templateName: tpl.name, value: total, status: 'rascunho', at: 'Hoje' }, ...prev])
    toast.success('✨ Proposta gerada pelo Atlas!')
  }

  const enviadas = propostas.filter((p) => p.status !== 'recusada')
  const totalAberto = propostas.filter((p) => p.status === 'enviada').reduce((s, p) => s + p.value, 0)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Comercial</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Propostas & Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Templates de marketing prontos, tudo editável — proposta gerada em segundos.</p>
        </div>
        <button onClick={() => openBuilder()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
          <Wand2 className="size-4" /> Nova proposta
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {([['propostas', 'Propostas'], ['templates', 'Templates'], ['contratos', 'Contratos']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('rounded-full border px-4 py-1.5 text-xs font-semibold transition-all',
              tab === id ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {/* PROPOSTAS */}
      {tab === 'propostas' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Propostas no mês" value={String(enviadas.length)} />
            <Kpi label="Em aberto (enviadas)" value={mx(totalAberto)} tone="text-sky-300" />
            <Kpi label="Fechadas" value={mx(propostas.filter((p) => p.status === 'aceita').reduce((s, p) => s + p.value, 0))} tone="text-emerald-300" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <ul className="divide-y divide-border">
              {propostas.map((p) => {
                const c = clientOf(p.clientId); const st = STATUS[p.status]
                return (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-brand"><FileText className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{c?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.templateName} · {p.at}</p>
                    </div>
                    <span className="font-display text-sm font-bold text-foreground tabular">{mx(p.value)}</span>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium', st.chip)}>
                      <span className={cn('size-1.5 rounded-full', st.dot)} /> {st.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}

      {/* TEMPLATES */}
      {tab === 'templates' && (
        <>
          <p className="text-sm text-muted-foreground">Comece por um template e ajuste do seu jeito — serviços, valores e texto, tudo editável.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <div key={t.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30">
                <span className="text-3xl">{t.emoji}</span>
                <h3 className="mt-3 font-display text-base font-bold text-foreground">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                <p className="mt-3 font-display text-lg font-extrabold text-brand tabular">{mx(t.items.reduce((s, i) => s + i.v, 0))}<span className="text-[10px] font-normal text-muted-foreground">/mês</span></p>
                <button onClick={() => openBuilder(t.id)} className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient text-xs font-semibold text-brand-foreground shadow-gold">
                  <Wand2 className="size-3.5" /> Usar template
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CONTRATOS */}
      {tab === 'contratos' && (
        <>
          <p className="text-sm text-muted-foreground">Modelos de contrato prontos — preencha o cliente e os valores e o Atlas monta o documento.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {CONTRACTS.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-brand/30">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-bold text-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
                <button onClick={() => toast.success(`Modelo "${c.name}" pronto para preencher`)} className="h-9 shrink-0 rounded-xl bg-brand-gradient px-3.5 text-xs font-semibold text-brand-foreground shadow-gold">Gerar</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* BUILDER */}
      <Sheet open={builder} onOpenChange={setBuilder}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Montar proposta</SheetTitle>
            <SheetDescription>Escolha um template e ajuste tudo — fica com a cara da agência.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente</span>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inp}>
                  {GINGA_CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Validade (dias)</span>
                <input type="number" value={validity} onChange={(e) => setValidity(Number(e.target.value))} className={inp} /></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Template base</span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => pickTemplate(t.id)} className={cn('rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all', tplId === t.id ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-card text-muted-foreground')}>
                    {t.emoji} {t.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Texto de abertura</span>
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" /></label>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Serviços & valores</span>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={it.s} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, s: e.target.value } : x))} className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
                    <input type="number" value={it.v} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, v: Number(e.target.value) } : x))} className="h-9 w-24 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
                    <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-muted-foreground/50 hover:text-rose-300"><Trash2 className="size-4" /></button>
                  </div>
                ))}
                <button onClick={() => setItems([...items, { s: 'Novo serviço', v: 0 }])} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand"><Plus className="size-3.5" /> Adicionar serviço</button>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-brand/10 px-4 py-2.5">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="font-display text-lg font-extrabold text-brand tabular">{mx(total)}/mês</span>
              </div>
            </div>

            <button onClick={gerar} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95">
              <Sparkles className="size-4" /> Gerar proposta
            </button>

            {doc && (
              <div className="rounded-2xl border border-brand/25 bg-background/60 p-4">
                <p className="kicker mb-2 text-brand">Documento gerado</p>
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-3 font-sans text-[12.5px] leading-relaxed text-foreground/90">{doc.text}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(doc.text); toast.success('Proposta copiada!') }} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-secondary"><Copy className="size-3.5" /> Copiar</button>
                  <a href={`https://wa.me/${doc.phone}?text=${encodeURIComponent(doc.text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 text-xs font-semibold text-black"><MessageCircle className="size-3.5" /> Enviar por WhatsApp</a>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const inp = 'h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'

function Kpi({ label, value, tone = 'text-foreground' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="kicker text-muted-foreground/50">{label}</p>
      <p className={cn('mt-2 font-display text-xl font-extrabold tabular', tone)}>{value}</p>
    </div>
  )
}

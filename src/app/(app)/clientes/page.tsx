import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, MessageCircle, Plus, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GINGA_CLIENTS, GINGA_PROJECTS, mx } from '@/lib/demo/agency'
import { EnviarPortal } from '@/components/clientes/enviar-portal'

export const metadata: Metadata = { title: 'Clientes' }
export const dynamic = 'force-dynamic'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  ativo:    { label: 'Ativo',    chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
  pausado:  { label: 'Pausado',  chip: 'bg-zinc-500/15 text-zinc-400',       dot: 'bg-zinc-500' },
  prospect: { label: 'Prospect', chip: 'bg-sky-500/15 text-sky-300',         dot: 'bg-sky-400' },
}

export default function ClientesPage() {
  const ativos = GINGA_CLIENTS.filter((c) => c.status === 'ativo')
  const mrr = ativos.reduce((s, c) => s + c.monthly, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Carteira</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ativos.length} ativos · {mx(mrr)}/mês em contratos · cada um tem seu portal.</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold">
          <Plus className="size-4" /> Novo cliente
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GINGA_CLIENTS.map((c) => {
          const st = STATUS[c.status]
          const projetos = GINGA_PROJECTS.filter((p) => p.clientId === c.id).length
          const initials = c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
          return (
            <div key={c.id} className={cn('animate-rise flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-brand/30', c.status === 'pausado' && 'opacity-75')}>
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient font-display text-sm font-extrabold text-brand-foreground">{initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-bold text-foreground">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.segment}</p>
                </div>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', st.chip)}>
                  <span className={cn('size-1.5 rounded-full', st.dot)} /> {st.label}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border py-3 text-center">
                <div><p className="font-display text-sm font-bold text-foreground tabular">{c.monthly ? mx(c.monthly).replace('MX$ ', '') : '—'}</p><p className="kicker text-muted-foreground/50">MX$/mês</p></div>
                <div><p className="font-display text-sm font-bold text-foreground tabular">{projetos}</p><p className="kicker text-muted-foreground/50">projetos</p></div>
                <div><p className={cn('font-display text-sm font-bold tabular', c.lastContactDays >= 14 ? 'text-amber-300' : 'text-foreground')}>{c.lastContactDays}d</p><p className="kicker text-muted-foreground/50">contato</p></div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">Contato: <span className="text-foreground">{c.contact}</span></p>

              <div className="mt-3 flex items-center gap-2">
                <EnviarPortal name={c.name} contact={c.contact} phone={c.phone} slug={slugify(c.name)} />
                <Link href={`/portal/${slugify(c.name)}`} target="_blank" className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-foreground transition-colors hover:bg-white/10" title="Ver portal">
                  <ExternalLink className="size-4" />
                </Link>
                <a href={`https://wa.me/${c.phone}`} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 transition-colors hover:bg-emerald-500/25" title="WhatsApp">
                  <MessageCircle className="size-4" />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <ArrowUpRight className="size-3.5" /> "Ver portal" abre a área externa do cliente — o que ele enxerga da conta.
      </p>
    </div>
  )
}

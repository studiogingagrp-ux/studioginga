import Link from 'next/link'
import {
  ArrowRight, Target, FolderKanban, KanbanSquare, BadgeCheck,
  Megaphone, Wallet, Sparkles, Check, ShieldCheck,
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { GrpCredit } from '@/components/brand/grp-credit'

const modulos = [
  { icon: Target,       title: 'Comercial',   desc: 'Pipeline do lead ao contrato, com valor por etapa.' },
  { icon: FolderKanban, title: 'Projetos',    desc: 'Cliente, equipe, prazo e progresso num lugar só.' },
  { icon: KanbanSquare, title: 'Operação',    desc: 'Kanban da equipe por tipo: arte, vídeo, copy, tráfego.' },
  { icon: BadgeCheck,   title: 'Aprovações',  desc: 'Materiais com versões e comentários — cliente aprova num toque.' },
  { icon: Megaphone,    title: 'Conteúdo',    desc: 'Calendário editorial de todas as redes, por cliente.' },
  { icon: Wallet,       title: 'Financeiro',  desc: 'Contratos, receita prevista e status de pagamento.' },
]

export default function Landing() {
  return (
    <div className="ginga-grain relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div aria-hidden className="ginga-glow pointer-events-none absolute inset-0 opacity-80" />
      <div aria-hidden className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-brand/10 blur-[120px]" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:border-brand/40">
          Entrar <ArrowRight className="size-4" />
        </Link>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.07] px-3 py-1 kicker text-brand">
                <Sparkles className="size-3.5" /> O cérebro da sua agência
              </span>
              <h1 className="animate-rise mt-5 font-display text-4xl font-extrabold leading-[1.03] tracking-tight text-foreground sm:text-6xl" style={{ animationDelay: '60ms' }}>
                A agência inteira,<br />
                <span className="text-brand-gradient">num sistema só.</span>
              </h1>
              <p className="animate-rise mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg" style={{ animationDelay: '120ms' }}>
                Comercial, projetos, aprovações, conteúdo e financeiro — orquestrados pelo <b className="text-foreground">Atlas</b>, a IA que trabalha como sua gerente de operações.
              </p>
              <div className="animate-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '180ms' }}>
                <Link href="/dashboard" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-7 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
                  Ver o painel <ArrowRight className="size-4" />
                </Link>
                <Link href="/portal/casa-lumen" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card/60 px-7 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-card">
                  Ver portal do cliente
                </Link>
              </div>
              <div className="animate-rise mt-6 flex items-center gap-4 text-xs text-muted-foreground" style={{ animationDelay: '240ms' }}>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-brand" /> Multiempresa isolado</span>
                <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-brand" /> pt · es · en</span>
              </div>
            </div>

            {/* Mock do painel */}
            <div className="animate-rise relative" style={{ animationDelay: '160ms' }}>
              <div className="rounded-3xl border border-border bg-card/80 p-4 shadow-pop backdrop-blur">
                <div className="mb-3 flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-brand" />
                  <span className="kicker text-muted-foreground">Briefing do Atlas</span>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-brand/[0.1] to-transparent p-4">
                  <p className="text-sm leading-relaxed text-foreground/90">
                    Bom dia, Estevam. Hoje: <b>5 compromissos</b>, <b className="text-sky-300">3 aprovações</b> aguardando e <b className="text-rose-300">2 tarefas atrasadas</b>. A campanha da Verde Market entra no ar em 3 dias.
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[['Clientes', '5'], ['Projetos', '5'], ['MRR', 'MX$ 179k']].map(([l, v]) => (
                    <div key={l} className="rounded-xl border border-border bg-background/60 p-3">
                      <p className="kicker text-muted-foreground/60">{l}</p>
                      <p className="mt-1 font-display text-lg font-extrabold text-foreground tabular">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  {[['Casa Lumen', 62, 'bg-amber-400'], ['Verde Market', 80, 'bg-sky-400'], ['Móvil Andes', 40, 'bg-emerald-400']].map(([n, p, c]) => (
                    <div key={n as string} className="flex items-center gap-2">
                      <span className="w-24 truncate text-xs text-muted-foreground">{n}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full rounded-full ${c}`} style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div aria-hidden className="absolute -bottom-5 -left-5 -z-10 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
            </div>
          </div>
        </section>

        {/* Módulos */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-10 max-w-xl">
            <p className="kicker text-brand">Um cérebro, tudo conectado</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Cada área da agência, no mesmo lugar.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modulos.map((m) => (
              <div key={m.title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-brand transition-colors group-hover:bg-brand/10">
                  <m.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">{m.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Atlas */}
        <section className="border-y border-border bg-card/30">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.07] px-3 py-1 kicker text-brand">
                <Sparkles className="size-3.5" /> Inteligência
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                O Atlas não é um chat.<br />É uma gerente de operações.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                Ele varre a agência o dia todo e avisa antes de virar problema: aprovação parada, projeto atrasado, designer sobrecarregado, cliente esquecido, oportunidade de upsell.
              </p>
              <ul className="mt-6 space-y-2.5">
                {['"Quem está disponível hoje?"', '"Qual cliente está há +30 dias sem contato?"', '"Reorganize minha agenda."'].map((q) => (
                  <li key={q} className="flex items-center gap-2.5 text-sm text-foreground/85">
                    <span className="grid size-5 place-items-center rounded-full bg-brand/15 text-brand"><Check className="size-3" /></span>
                    {q}
                  </li>
                ))}
              </ul>
              <Link href="/atlas" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-brand-gradient px-6 text-sm font-semibold text-brand-foreground shadow-gold">
                <Sparkles className="size-4" /> Conhecer o Atlas
              </Link>
            </div>
            <div className="rounded-3xl border border-brand/20 bg-background/60 p-5 shadow-pop">
              {[
                ['urgente', 'Aprovação parada há 4 dias', 'O vídeo da Clínica Aurora aguarda o cliente desde sexta.'],
                ['atencao', 'Regina está sobrecarregada', '4 tarefas de alta prioridade nesta semana.'],
                ['oportunidade', 'Oportunidade de upsell', 'Casa Lumen com alto engajamento e sem tráfego pago.'],
              ].map(([sev, t, b]) => (
                <div key={t} className="mb-2.5 rounded-2xl border border-border bg-card p-4 last:mb-0">
                  <div className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${sev === 'urgente' ? 'bg-rose-400' : sev === 'atencao' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <p className="text-sm font-semibold text-foreground">{t}</p>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Sua agência merece um sistema à altura dela.
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-8 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
              Entrar no Ginga Studio OS <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-10">
        <GrpCredit />
      </footer>
    </div>
  )
}

'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip,
  AreaChart, Area, PieChart, Pie, CartesianGrid,
} from 'recharts'
import { cn } from '@/lib/utils'
import {
  GINGA_TEAM, GINGA_TASKS, GINGA_LEADS, GINGA_FINANCE, STAGE_META, STAGE_ORDER, mx,
} from '@/lib/demo/agency'

const GOLD = '#f2b23e'
const ORANGE = '#f0722a'

function Tip({ active, payload, label, suffix }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-pop">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color ?? GOLD }} />
          {p.name}: <span className="font-medium text-foreground">{suffix === 'mx' ? mx(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function RelatoriosView() {
  const produtividade = GINGA_TEAM.map((m) => ({
    name: m.name.split(' ')[0],
    tarefas: GINGA_TASKS.filter((t) => t.memberId === m.id).length,
    color: m.color,
  }))

  const entregas = [
    { semana: 'S-5', entregas: 6 }, { semana: 'S-4', entregas: 9 },
    { semana: 'S-3', entregas: 7 }, { semana: 'S-2', entregas: 12 },
    { semana: 'S-1', entregas: 10 }, { semana: 'Atual', entregas: 8 },
  ]

  const receita = (['pago', 'pendente', 'atrasado'] as const).map((s) => ({
    name: s === 'pago' ? 'Pago' : s === 'pendente' ? 'A receber' : 'Atrasado',
    value: GINGA_FINANCE.filter((f) => f.status === s).reduce((a, f) => a + f.amount, 0),
    color: s === 'pago' ? '#34d399' : s === 'pendente' ? GOLD : '#fb7185',
  }))

  const funil = STAGE_ORDER.filter((s) => s !== 'perdido').map((s) => ({
    etapa: STAGE_META[s].label.replace(' marcada', '').replace(' enviada', ''),
    leads: GINGA_LEADS.filter((l) => l.stage === s).length,
  }))

  const totalTarefas = GINGA_TASKS.length
  const concluidas = GINGA_TASKS.filter((t) => t.status === 'concluido').length
  const entregasMes = 33
  const receitaTotal = GINGA_FINANCE.reduce((a, f) => a + f.amount, 0)

  const kpis = [
    { label: 'Tarefas no mês', value: String(totalTarefas) },
    { label: 'Taxa de conclusão', value: `${Math.round((concluidas / totalTarefas) * 100)}%` },
    { label: 'Entregas no mês', value: String(entregasMes) },
    { label: 'Faturamento', value: mx(receitaTotal) },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="kicker text-brand">Inteligência</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Produtividade, entregas, receita e funil — a saúde da agência de relance.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="kicker text-muted-foreground/50">{k.label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-foreground tabular">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Produtividade da equipe" sub="Tarefas por pessoa">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={produtividade} layout="vertical" margin={{ left: 8, right: 12 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={70} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<Tip />} />
              <Bar dataKey="tarefas" radius={[0, 6, 6, 0]} barSize={18}>
                {produtividade.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Entregas por semana" sub="Últimas 6 semanas">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={entregas} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="ent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="semana" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="entregas" stroke={GOLD} strokeWidth={2.5} fill="url(#ent)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Receita por status" sub="Contratos e avulsos do mês">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={receita} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {receita.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<Tip suffix="mx" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {receita.map((r) => (
                <div key={r.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="flex-1 text-sm text-muted-foreground">{r.name}</span>
                  <span className="font-mono text-xs font-medium text-foreground tabular">{mx(r.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Funil comercial" sub="Leads por etapa">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funil} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="etapa" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<Tip />} />
              <Bar dataKey="leads" radius={[6, 6, 0, 0]} barSize={30} fill={ORANGE} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-card')}>
      <div className="mb-4">
        <p className="kicker text-muted-foreground/50">{sub}</p>
        <h2 className="mt-0.5 font-display text-base font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}

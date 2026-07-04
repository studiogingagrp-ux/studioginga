'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Zap, ArrowRight, CalendarPlus, BadgeCheck, AlarmClock, TrendingUp, Wallet, UserX,
  MessageCircle, ListPlus, CalendarClock, Bell, Sparkles, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Recipe {
  id: string
  icon: LucideIcon
  trigger: string
  actions: { icon: LucideIcon; label: string }[]
  enabled: boolean
}

const INITIAL: Recipe[] = [
  {
    id: 'r1', icon: CalendarPlus, trigger: 'Quando uma reunião é criada', enabled: true,
    actions: [
      { icon: MessageCircle, label: 'Enviar WhatsApp de confirmação' },
      { icon: ListPlus, label: 'Criar tarefa de preparação' },
      { icon: CalendarClock, label: 'Adicionar ao calendário' },
      { icon: Bell, label: 'Notificar a equipe' },
    ],
  },
  {
    id: 'r2', icon: BadgeCheck, trigger: 'Quando o cliente aprova um material', enabled: true,
    actions: [
      { icon: TrendingUp, label: 'Mover projeto para a próxima etapa' },
      { icon: Bell, label: 'Notificar o responsável' },
      { icon: CalendarClock, label: 'Agendar publicação' },
    ],
  },
  {
    id: 'r3', icon: AlarmClock, trigger: 'Quando uma tarefa fica atrasada', enabled: true,
    actions: [
      { icon: MessageCircle, label: 'Alertar o responsável no WhatsApp' },
      { icon: Sparkles, label: 'Sinalizar no Atlas' },
    ],
  },
  {
    id: 'r4', icon: TrendingUp, trigger: 'Quando um lead fica 7 dias parado', enabled: false,
    actions: [
      { icon: Bell, label: 'Lembrar o comercial' },
      { icon: Sparkles, label: 'Sugerir follow-up pelo Atlas' },
    ],
  },
  {
    id: 'r5', icon: Wallet, trigger: 'Quando um contrato vence em 3 dias', enabled: true,
    actions: [
      { icon: MessageCircle, label: 'Enviar cobrança por WhatsApp' },
      { icon: Bell, label: 'Notificar o financeiro' },
    ],
  },
  {
    id: 'r6', icon: UserX, trigger: 'Quando um cliente fica 30 dias sem contato', enabled: false,
    actions: [
      { icon: Sparkles, label: 'Sugerir reativação' },
      { icon: ListPlus, label: 'Criar tarefa de atendimento' },
    ],
  },
]

export function AutomacoesView() {
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL)
  const ativas = recipes.filter((r) => r.enabled).length

  function toggle(id: string) {
    setRecipes((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r))
    const r = recipes.find((x) => x.id === id)
    if (r) toast.success(r.enabled ? 'Automação desligada' : '⚡ Automação ligada')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Automações</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Fluxos automáticos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ativas} de {recipes.length} ligadas · o Atlas executa enquanto a equipe cria.</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold">
          <Zap className="size-4" /> Nova automação
        </button>
      </header>

      <div className="space-y-3">
        {recipes.map((r) => (
          <div key={r.id} className={cn('rounded-2xl border bg-card p-5 shadow-card transition-colors', r.enabled ? 'border-brand/25' : 'border-border opacity-70')}>
            <div className="flex items-start gap-4">
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', r.enabled ? 'bg-brand/10 text-brand' : 'bg-secondary text-muted-foreground')}>
                <r.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-[15px] font-bold text-foreground">{r.trigger}</p>
                  <Switch on={r.enabled} onClick={() => toggle(r.id)} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {r.actions.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      {i > 0 && <ArrowRight className="size-3 text-muted-foreground/40" />}
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        <a.icon className="size-3 text-brand" /> {a.label}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <Sparkles className="size-3.5 text-brand" /> Em breve: construtor visual de fluxos e integrações (Google, Meet, Zoom, Drive).
      </p>
    </div>
  )
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-brand' : 'bg-secondary')} aria-pressed={on}>
      <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

'use client'

import { useState } from 'react'
import {
  CalendarCheck, Bell, UserX, Repeat, Cake, Star, MessageSquareHeart,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'

interface Automation {
  id: string
  icon: LucideIcon
  title: string
  timing: string
  template: string
  enabled: boolean
}
interface Group { category: string; items: Automation[] }

const INITIAL: Group[] = [
  {
    category: 'Confirmações',
    items: [
      { id: 'c48', icon: CalendarCheck, title: 'Confirmação 48h antes', timing: '48 horas antes da reunião', template: 'Olá {nome}! Confirmando sua reunião com {membro} em {data} às {hora}. Podemos confirmar?', enabled: true },
      { id: 'c24', icon: CalendarCheck, title: 'Confirmação 24h antes', timing: '24 horas antes da reunião', template: 'Oi {nome}, sua reunião é amanhã às {hora}. Está tudo certo?', enabled: true },
      { id: 'c2',  icon: Bell,          title: 'Lembrete 2h antes',     timing: '2 horas antes da reunião',  template: 'Lembrete: sua reunião é hoje às {hora}. Te esperamos! 💙', enabled: true },
    ],
  },
  {
    category: 'Faltas e retornos',
    items: [
      { id: 'ns',  icon: UserX,  title: 'Cliente faltou',   timing: 'logo após o horário não comparecido', template: 'Sentimos sua falta, {nome}. Quer reagendar sua reunião?', enabled: true },
      { id: 'r30', icon: Repeat, title: 'Follow-up em 30 dias', timing: '30 dias após o último contato',          template: 'Olá {nome}! Já se passaram 30 dias desde nosso último papo. Que tal um follow-up?', enabled: true },
      { id: 'r6m', icon: Repeat, title: 'Reunião de resultados semestral', timing: '6 meses após o último contato',          template: 'Oi {nome}, vamos marcar nossa reunião de resultados do semestre?', enabled: false },
    ],
  },
  {
    category: 'Relacionamento',
    items: [
      { id: 'bday', icon: Cake,             title: 'Aniversário',          timing: 'no dia do aniversário',     template: 'Feliz aniversário, {nome}! 🎉 A equipe Atlas Agenda Center deseja um dia maravilhoso.', enabled: true },
      { id: 'nps',  icon: MessageSquareHeart, title: 'Pesquisa de satisfação', timing: 'após o atendimento',     template: 'Como foi sua experiência hoje, {nome}? Sua opinião é muito importante!', enabled: true },
      { id: 'goog', icon: Star,            title: 'Avaliação no Google',  timing: 'após avaliação positiva',   template: 'Que bom que gostou, {nome}! Você poderia nos avaliar no Google? ⭐ {link}', enabled: false },
    ],
  },
]

export function AutomationsManager() {
  const [groups, setGroups] = useState<Group[]>(INITIAL)

  function toggle(id: string) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((it) => {
          if (it.id !== id) return it
          const enabled = !it.enabled
          toast[enabled ? 'success' : 'message'](`${it.title} ${enabled ? 'ativada' : 'desativada'}`)
          return { ...it, enabled }
        }),
      })),
    )
  }

  const activeCount = groups.flatMap((g) => g.items).filter((i) => i.enabled).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Automações"
        subtitle={`${activeCount} automações ativas · disparadas pelo WhatsApp`}
      />

      {groups.map((g) => (
        <div key={g.category}>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.category}</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {g.items.map((it) => (
              <div key={it.id} className="flex items-start gap-3 border-b border-border/60 p-4 last:border-0">
                <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', it.enabled ? 'bg-accent text-brand' : 'bg-secondary text-muted-foreground')}>
                  <it.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{it.title}</p>
                  <p className="text-xs text-muted-foreground">{it.timing}</p>
                  <p className="mt-1.5 truncate rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs italic text-muted-foreground">
                    “{it.template}”
                  </p>
                </div>
                <Toggle on={it.enabled} onClick={() => toggle(it.id)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={cn('relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-brand' : 'bg-secondary')}
    >
      <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  )
}

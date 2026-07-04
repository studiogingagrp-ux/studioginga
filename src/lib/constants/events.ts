import type { EventStatus, EventType } from '@/types/database'

/** Metadados de cada status — cores discretas para a agenda. */
export const STATUS_META: Record<
  EventStatus,
  { label: string; dot: string; chip: string }
> = {
  agendado:       { label: 'Agendado',       dot: 'bg-slate-400',   chip: 'bg-slate-100 text-slate-700' },
  confirmado:     { label: 'Confirmado',     dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  em_andamento:   { label: 'Em andamento',   dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700' },
  finalizado:     { label: 'Finalizado',     dot: 'bg-zinc-400',    chip: 'bg-zinc-100 text-zinc-600' },
  cancelado:      { label: 'Cancelado',      dot: 'bg-rose-400',    chip: 'bg-rose-50 text-rose-700' },
  nao_compareceu: { label: 'Não compareceu', dot: 'bg-red-500',     chip: 'bg-red-50 text-red-700' },
}

export const STATUS_ORDER: EventStatus[] = [
  'agendado', 'confirmado', 'em_andamento',
  'finalizado', 'cancelado', 'nao_compareceu',
]

/** Metadados de cada tipo de evento. */
export const TYPE_META: Record<EventType, { label: string; emoji: string }> = {
  reuniao:  { label: 'Reunião',  emoji: '🤝' },
  call:     { label: 'Call',     emoji: '📞' },
  gravacao: { label: 'Gravação', emoji: '🎬' },
  entrega:  { label: 'Entrega',  emoji: '📦' },
  interno:  { label: 'Interno',  emoji: '🏠' },
  pessoal:  { label: 'Pessoal',  emoji: '🔒' },
  bloqueio: { label: 'Bloqueio', emoji: '⛔' },
}

export const TYPE_ORDER: EventType[] = [
  'reuniao', 'call', 'gravacao', 'entrega', 'interno', 'pessoal', 'bloqueio',
]

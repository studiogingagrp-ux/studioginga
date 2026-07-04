import type {
  LeadStage, TaskStatus, ContentChannel, ContentStatus,
  MeetingAgendaItem, MeetingActionItem,
} from '@/types/database'

/**
 * Dados de demonstração dos módulos de marketing — coerentes com
 * DEMO_MEMBERS (m1..m4) e DEMO_CLIENTS (Vida Bella, Grupo Andrade, Café Central…).
 */

// ─── PIPELINE ────────────────────────────────────────────────
export interface DemoLead {
  id: string
  name: string
  company: string
  phone: string
  value: number // MX$/mês
  stage: LeadStage
  memberId: string
  notes?: string
  days: number // dias no estágio (para o sinal de "esfriando")
}

export const DEMO_LEADS: DemoLead[] = [
  { id: 'l1', name: 'Paola Ramírez',   company: 'Dulce Vida Pastelería', phone: '5215511223344', value: 8000,  stage: 'novo',       memberId: 'm1', days: 1 },
  { id: 'l2', name: 'Héctor Molina',   company: 'Molina Abogados',       phone: '5215522334455', value: 12000, stage: 'novo',       memberId: 'm3', days: 3 },
  { id: 'l3', name: 'Lucía Fuentes',   company: 'Spa Serenity',          phone: '5215533445566', value: 9500,  stage: 'em_contato', memberId: 'm1', days: 2 },
  { id: 'l4', name: 'Andrés Beltrán',  company: 'Beltrán Bienes Raíces', phone: '5215544556677', value: 18000, stage: 'proposta',   memberId: 'm1', days: 5, notes: 'Quer case de imobiliária antes de fechar' },
  { id: 'l5', name: 'Mariana Quintero',company: 'Clínica Sonrisa',       phone: '5215555667788', value: 15000, stage: 'proposta',   memberId: 'm3', days: 9 },
  { id: 'l6', name: 'Roberto Chávez',  company: 'Chávez Motors',         phone: '5215566778899', value: 22000, stage: 'negociacao', memberId: 'm1', days: 4, notes: 'Pediu 10% de desconto no semestral' },
  { id: 'l7', name: 'Dra. Sofía Herrera', company: 'Clínica Vida Bella', phone: '5215512345678', value: 14000, stage: 'fechado',    memberId: 'm1', days: 0 },
  { id: 'l8', name: 'Iván Castillo',   company: 'FitZone Gym',           phone: '5215577889900', value: 7000,  stage: 'perdido',    memberId: 'm3', days: 12, notes: 'Fechou com agência local mais barata' },
]

export const STAGE_META: Record<LeadStage, { label: string; dot: string; header: string }> = {
  novo:       { label: 'Novo lead',   dot: 'bg-sky-400',     header: 'text-sky-700' },
  em_contato: { label: 'Em contato',  dot: 'bg-indigo-400',  header: 'text-indigo-700' },
  reuniao:    { label: 'Reunião',     dot: 'bg-violet-400',  header: 'text-violet-700' },
  proposta:   { label: 'Proposta',    dot: 'bg-amber-400',   header: 'text-amber-700' },
  negociacao: { label: 'Negociação',  dot: 'bg-orange-400',  header: 'text-orange-700' },
  fechado:    { label: 'Fechado 🎉',  dot: 'bg-emerald-500', header: 'text-emerald-700' },
  perdido:    { label: 'Perdido',     dot: 'bg-zinc-300',    header: 'text-zinc-500' },
}

export const STAGE_ORDER: LeadStage[] = ['novo', 'em_contato', 'reuniao', 'proposta', 'negociacao', 'fechado', 'perdido']

// ─── CAMPANHAS (tarefas) ─────────────────────────────────────
export interface DemoTask {
  id: string
  title: string
  clientName: string
  memberId: string
  status: TaskStatus
  due: string   // ISO date
  tag?: string
}

const d = (offset: number) => {
  const x = new Date(); x.setDate(x.getDate() + offset)
  return x.toISOString().split('T')[0]
}

export const DEMO_TASKS: DemoTask[] = [
  { id: 't1',  title: 'Roteiro dos reels de julho',        clientName: 'Clínica Vida Bella', memberId: 'm2', status: 'a_fazer',   due: d(1),  tag: 'Conteúdo' },
  { id: 't2',  title: 'Subir campanha de leads — inverno', clientName: 'Grupo Andrade',      memberId: 'm3', status: 'a_fazer',   due: d(0),  tag: 'Tráfego' },
  { id: 't3',  title: 'Proposta de rebranding',            clientName: 'Café Central',       memberId: 'm1', status: 'a_fazer',   due: d(3),  tag: 'Comercial' },
  { id: 't4',  title: 'Gravação — vitrine de inverno',     clientName: 'Café Central',       memberId: 'm4', status: 'fazendo',   due: d(0),  tag: 'Audiovisual' },
  { id: 't5',  title: 'Otimizar conjuntos de anúncio',     clientName: 'Clínica Vida Bella', memberId: 'm3', status: 'fazendo',   due: d(1),  tag: 'Tráfego' },
  { id: 't6',  title: 'Calendário editorial de julho',     clientName: 'Café Central',       memberId: 'm2', status: 'revisao',   due: d(-1), tag: 'Conteúdo' },
  { id: 't7',  title: 'Edição — depoimentos de clientes',  clientName: 'Grupo Andrade',      memberId: 'm4', status: 'revisao',   due: d(2),  tag: 'Audiovisual' },
  { id: 't8',  title: 'Relatório mensal de resultados',    clientName: 'Grupo Andrade',      memberId: 'm3', status: 'concluida', due: d(-2), tag: 'Relatório' },
  { id: 't9',  title: 'Posts da semana aprovados',         clientName: 'Clínica Vida Bella', memberId: 'm2', status: 'concluida', due: d(-1), tag: 'Conteúdo' },
]

export const TASK_STATUS_META: Record<TaskStatus, { label: string; dot: string }> = {
  a_fazer:   { label: 'A fazer',   dot: 'bg-slate-400' },
  fazendo:   { label: 'Fazendo',   dot: 'bg-amber-500' },
  revisao:   { label: 'Revisão',   dot: 'bg-violet-500' },
  concluida: { label: 'Concluída', dot: 'bg-emerald-500' },
}

export const TASK_STATUS_ORDER: TaskStatus[] = ['a_fazer', 'fazendo', 'revisao', 'concluida']

// ─── CONTEÚDO ────────────────────────────────────────────────
export interface DemoPost {
  id: string
  title: string
  clientName: string
  channel: ContentChannel
  status: ContentStatus
  date: string // ISO date (dia do mês corrente)
}

const monthDay = (day: number) => {
  const x = new Date()
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export const DEMO_POSTS: DemoPost[] = [
  { id: 'p1',  title: 'Reel — antes e depois',        clientName: 'Clínica Vida Bella', channel: 'instagram', status: 'publicado', date: monthDay(1) },
  { id: 'p2',  title: 'Carrossel — 5 dicas de pele',  clientName: 'Clínica Vida Bella', channel: 'instagram', status: 'agendado',  date: monthDay(3) },
  { id: 'p3',  title: 'Vídeo — tour pela clínica',    clientName: 'Clínica Vida Bella', channel: 'tiktok',    status: 'aprovacao', date: monthDay(8) },
  { id: 'p4',  title: 'Story — promoção de inverno',  clientName: 'Café Central',       channel: 'instagram', status: 'aprovado',  date: monthDay(4) },
  { id: 'p5',  title: 'Reel — novo cardápio',         clientName: 'Café Central',       channel: 'instagram', status: 'rascunho',  date: monthDay(10) },
  { id: 'p6',  title: 'Post — depoimento cliente',    clientName: 'Grupo Andrade',      channel: 'linkedin',  status: 'aprovacao', date: monthDay(7) },
  { id: 'p7',  title: 'Vídeo case — imobiliária',     clientName: 'Grupo Andrade',      channel: 'youtube',   status: 'rascunho',  date: monthDay(15) },
  { id: 'p8',  title: 'Reel — bastidores gravação',   clientName: 'Café Central',       channel: 'tiktok',    status: 'agendado',  date: monthDay(12) },
  { id: 'p9',  title: 'Carrossel — resultados 1º sem',clientName: 'Grupo Andrade',      channel: 'instagram', status: 'aprovado',  date: monthDay(18) },
  { id: 'p10', title: 'Live — perguntas e respostas', clientName: 'Clínica Vida Bella', channel: 'instagram', status: 'rascunho',  date: monthDay(22) },
]

export const CHANNEL_META: Record<ContentChannel, { label: string; emoji: string; chip: string }> = {
  instagram: { label: 'Instagram', emoji: '📸', chip: 'bg-pink-50 text-pink-700' },
  facebook:  { label: 'Facebook',  emoji: '👥', chip: 'bg-blue-50 text-blue-700' },
  tiktok:    { label: 'TikTok',    emoji: '🎵', chip: 'bg-zinc-100 text-zinc-700' },
  youtube:   { label: 'YouTube',   emoji: '▶️', chip: 'bg-red-50 text-red-700' },
  linkedin:  { label: 'LinkedIn',  emoji: '💼', chip: 'bg-sky-50 text-sky-700' },
}

export const CONTENT_STATUS_META: Record<ContentStatus, { label: string; chip: string; dot: string }> = {
  rascunho:  { label: 'Rascunho',     chip: 'bg-zinc-100 text-zinc-600',       dot: 'bg-zinc-400' },
  aprovacao: { label: 'Em aprovação', chip: 'bg-amber-50 text-amber-700',      dot: 'bg-amber-500' },
  aprovado:  { label: 'Aprovado',     chip: 'bg-sky-50 text-sky-700',          dot: 'bg-sky-500' },
  agendado:  { label: 'Agendado',     chip: 'bg-violet-50 text-violet-700',    dot: 'bg-violet-500' },
  publicado: { label: 'Publicado',    chip: 'bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
}

export const CONTENT_STATUS_ORDER: ContentStatus[] = ['rascunho', 'aprovacao', 'aprovado', 'agendado', 'publicado']

// ─── REUNIÕES INTERATIVAS ────────────────────────────────────
export interface DemoMeeting {
  eventId: string
  callUrl?: string
  agenda: MeetingAgendaItem[]
  notes: string
  actions: MeetingActionItem[]
}

export const DEMO_MEETINGS: DemoMeeting[] = [
  {
    eventId: 'e1', // Reunião — Clínica Vida Bella (Estevam, 09:00)
    callUrl: 'https://meet.google.com/atlas-demo-vb',
    agenda: [
      { id: 'a1', text: 'Resultados de junho (alcance + leads)', done: true },
      { id: 'a2', text: 'Aprovação do calendário de julho', done: false },
      { id: 'a3', text: 'Proposta: campanha dia das mães MX', done: false },
    ],
    notes: 'Sofía quer foco em procedimentos de inverno. Orçamento extra aprovado para TikTok.',
    actions: [
      { id: 'x1', text: 'Enviar calendário de julho revisado', member_id: 'm2', done: false },
      { id: 'x2', text: 'Criar campanha TikTok — procedimentos', member_id: 'm3', done: false },
    ],
  },
  {
    eventId: 'e3', // Call — proposta Grupo Andrade (Estevam, 14:00)
    callUrl: 'https://meet.google.com/atlas-demo-ga',
    agenda: [
      { id: 'a1', text: 'Apresentar case imobiliária', done: false },
      { id: 'a2', text: 'Escopo do pacote semestral', done: false },
    ],
    notes: '',
    actions: [],
  },
]

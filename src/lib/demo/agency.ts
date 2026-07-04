// ─────────────────────────────────────────────────────────────────────────────
// GINGA STUDIO — dataset demo coeso (a agência do Estevam, México).
// Todos os módulos leem daqui: um cliente que aparece no CRM tem projeto,
// tarefas, aprovações e financeiro conectados. Uma história só.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  ProjectStatus, Priority, OpTaskStatus, OpTaskType,
  ApprovalType, ApprovalStatus, FinanceType, FinanceStatus,
  AtlasSeverity, AtlasAlertKind, LeadStage,
  ContentChannel, ContentStatus,
} from '@/types/database'

export const mx = (v: number) => `MX$ ${v.toLocaleString('es-MX')}`

const iso = (offset: number) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}
const today = () => new Date().toISOString().split('T')[0]

// ── EQUIPE ───────────────────────────────────────────────────
export interface GingaMember {
  id: string; name: string; role: string; color: string; initials: string; owner?: boolean; online?: boolean
}
export const GINGA_TEAM: GingaMember[] = [
  { id: 'g1', name: 'Estevam Ríos',    role: 'Fundador · Direção',     color: '#f2b23e', initials: 'ER', owner: true, online: true },
  { id: 'g2', name: 'Regina Salas',    role: 'Head de Criação',        color: '#f0722a', initials: 'RS', online: true },
  { id: 'g3', name: 'Mateo Cordero',   role: 'Tráfego & Growth',       color: '#38bdf8', initials: 'MC', online: true },
  { id: 'g4', name: 'Valentina Cruz',  role: 'Social & Conteúdo',      color: '#a78bfa', initials: 'VC', online: false },
  { id: 'g5', name: 'Bruno Tavares',   role: 'Audiovisual',            color: '#34d399', initials: 'BT', online: true },
  { id: 'g6', name: 'Camila Ortiz',    role: 'Atendimento & Projetos', color: '#fb7185', initials: 'CO', online: false },
]
export const memberOf = (id: string | null) => GINGA_TEAM.find((m) => m.id === id)

// ── CLIENTES ─────────────────────────────────────────────────
export interface GingaClient {
  id: string; name: string; segment: string; contact: string; phone: string
  monthly: number; status: 'ativo' | 'pausado' | 'prospect'; since: string; lastContactDays: number
}
export const GINGA_CLIENTS: GingaClient[] = [
  { id: 'c1', name: 'Casa Lumen',    segment: 'Arquitetura & Interiores', contact: 'Sofía Herrera',   phone: '5215512345678', monthly: 42000, status: 'ativo',   since: '2025-11', lastContactDays: 1 },
  { id: 'c2', name: 'Verde Market',  segment: 'Mercado orgânico',         contact: 'Diego Salinas',   phone: '5215522334455', monthly: 28000, status: 'ativo',   since: '2026-01', lastContactDays: 0 },
  { id: 'c3', name: 'Nauta Café',    segment: 'Cafeteria',                contact: 'Camila Torres',   phone: '5215577778888', monthly: 18000, status: 'ativo',   since: '2026-02', lastContactDays: 2 },
  { id: 'c4', name: 'Móvil Andes',   segment: 'Imobiliária',              contact: 'Ricardo Andrade', phone: '5215598765432', monthly: 55000, status: 'ativo',   since: '2025-09', lastContactDays: 4 },
  { id: 'c5', name: 'Clínica Aurora',segment: 'Estética & Saúde',         contact: 'Dra. Lucía Fuentes', phone: '5215533445566', monthly: 36000, status: 'ativo', since: '2026-03', lastContactDays: 5 },
  { id: 'c6', name: 'Fuego Cantina', segment: 'Restaurante',              contact: 'Andrés Beltrán',  phone: '5215544556677', monthly: 24000, status: 'pausado', since: '2025-12', lastContactDays: 42 },
  { id: 'c7', name: 'Nube Fitness',  segment: 'Academia',                 contact: 'Iván Castillo',   phone: '5215566778899', monthly: 0,     status: 'prospect', since: '2026-07', lastContactDays: 2 },
]
export const clientOf = (id: string | null) => GINGA_CLIENTS.find((c) => c.id === id)

// ── PROJETOS ─────────────────────────────────────────────────
export interface DemoProject {
  id: string; name: string; clientId: string; leadId: string; teamIds: string[]
  deadline: string; status: ProjectStatus; priority: Priority; progress: number; description: string
}
export const GINGA_PROJECTS: DemoProject[] = [
  { id: 'pr1', name: 'Rebranding completo',    clientId: 'c1', leadId: 'g2', teamIds: ['g2', 'g5'],        deadline: iso(9),  status: 'producao',           priority: 'alta',    progress: 62, description: 'Nova identidade visual + manual de marca + aplicações.' },
  { id: 'pr2', name: 'Campanha inverno MX',    clientId: 'c2', leadId: 'g3', teamIds: ['g3', 'g4'],        deadline: iso(3),  status: 'aguardando_cliente', priority: 'urgente', progress: 80, description: 'Campanha de performance para a linha de inverno.' },
  { id: 'pr3', name: 'Social media julho',     clientId: 'c3', leadId: 'g4', teamIds: ['g4', 'g5'],        deadline: iso(1),  status: 'revisao_interna',    priority: 'alta',    progress: 74, description: 'Calendário editorial + reels + stories.' },
  { id: 'pr4', name: 'Lançamento residencial', clientId: 'c4', leadId: 'g6', teamIds: ['g2', 'g3', 'g5'],  deadline: iso(18), status: 'producao',           priority: 'alta',    progress: 40, description: 'Landing + tráfego + vídeo institucional do empreendimento.' },
  { id: 'pr5', name: 'Vídeo institucional',    clientId: 'c5', leadId: 'g5', teamIds: ['g5'],              deadline: iso(-2), status: 'aguardando_cliente', priority: 'media',   progress: 90, description: 'Roteiro, gravação e edição do vídeo da clínica.' },
  { id: 'pr6', name: 'Site novo + SEO',        clientId: 'c4', leadId: 'g2', teamIds: ['g2', 'g3'],        deadline: iso(25), status: 'planejamento',       priority: 'media',   progress: 12, description: 'Redesign do site e otimização de busca.' },
  { id: 'pr7', name: 'Menu digital + fotos',   clientId: 'c6', leadId: 'g6', teamIds: ['g5', 'g4'],        deadline: iso(30), status: 'pausado',            priority: 'baixa',   progress: 25, description: 'Cardápio digital e ensaio fotográfico gastronômico.' },
]

// ── KANBAN OPERACIONAL ───────────────────────────────────────
export interface DemoOpTask {
  id: string; title: string; clientId: string; projectId: string | null; memberId: string
  type: OpTaskType; status: OpTaskStatus; priority: Priority; due: string
}
export const GINGA_TASKS: DemoOpTask[] = [
  { id: 't1',  title: 'Manual de marca — capítulo cor',    clientId: 'c1', projectId: 'pr1', memberId: 'g2', type: 'arte',     status: 'producao',             priority: 'alta',    due: iso(2) },
  { id: 't2',  title: 'Criativos de anúncio (5 formatos)', clientId: 'c2', projectId: 'pr2', memberId: 'g3', type: 'trafego',  status: 'aguardando_aprovacao', priority: 'urgente', due: iso(0) },
  { id: 't3',  title: 'Roteiro dos reels de julho',        clientId: 'c3', projectId: 'pr3', memberId: 'g4', type: 'copy',     status: 'revisao_interna',      priority: 'alta',    due: iso(-1) },
  { id: 't4',  title: 'Edição vídeo institucional',        clientId: 'c5', projectId: 'pr5', memberId: 'g5', type: 'video',    status: 'aguardando_aprovacao', priority: 'media',   due: iso(-2) },
  { id: 't5',  title: 'Wireframe da landing',              clientId: 'c4', projectId: 'pr4', memberId: 'g2', type: 'site',     status: 'a_fazer',              priority: 'alta',    due: iso(4) },
  { id: 't6',  title: 'Setup de campanha (Meta Ads)',      clientId: 'c4', projectId: 'pr4', memberId: 'g3', type: 'trafego',  status: 'a_fazer',              priority: 'media',   due: iso(3) },
  { id: 't7',  title: 'Ensaio de fotos — produtos',        clientId: 'c2', projectId: 'pr2', memberId: 'g5', type: 'video',    status: 'producao',             priority: 'media',   due: iso(1) },
  { id: 't8',  title: 'Ajustes solicitados no logo',       clientId: 'c1', projectId: 'pr1', memberId: 'g2', type: 'arte',     status: 'ajustes',              priority: 'alta',    due: iso(1) },
  { id: 't9',  title: 'Legendas da semana',                clientId: 'c3', projectId: 'pr3', memberId: 'g4', type: 'social',   status: 'concluido',            priority: 'baixa',   due: iso(-1) },
  { id: 't10', title: 'Relatório de resultados — junho',   clientId: 'c4', projectId: null,  memberId: 'g3', type: 'campanha', status: 'concluido',            priority: 'media',   due: iso(-3) },
  { id: 't11', title: 'Briefing dia dos pais',             clientId: 'c5', projectId: null,  memberId: 'g6', type: 'reuniao',  status: 'a_fazer',              priority: 'media',   due: iso(2) },
  { id: 't12', title: 'Copy do e-mail de reativação',      clientId: 'c6', projectId: 'pr7', memberId: 'g4', type: 'copy',     status: 'producao',             priority: 'baixa',   due: iso(5) },
]

// ── CENTRAL DE APROVAÇÃO ─────────────────────────────────────
export interface DemoApprovalComment { id: string; author: string; fromClient: boolean; text: string; at: string }
export interface DemoApproval {
  id: string; title: string; clientId: string; projectId: string | null
  type: ApprovalType; status: ApprovalStatus; version: number; preview: string
  caption: string; comments: DemoApprovalComment[]; at: string
}
export const GINGA_APPROVALS: DemoApproval[] = [
  {
    id: 'ap1', title: 'Logo — proposta A', clientId: 'c1', projectId: 'pr1',
    type: 'arte', status: 'alteracao', version: 2, preview: 'gold', at: iso(-4),
    caption: 'Primeira rodada do símbolo. Versão horizontal e reduzida.',
    comments: [
      { id: 'x1', author: 'Sofía (Casa Lumen)', fromClient: true, text: 'Amei o conceito! Só deixaria o símbolo um pouco mais fino.', at: iso(-3) },
      { id: 'x2', author: 'Regina', fromClient: false, text: 'Ajustando o peso do traço, reenvio hoje.', at: iso(-3) },
    ],
  },
  {
    id: 'ap2', title: 'Criativos anúncio — inverno', clientId: 'c2', projectId: 'pr2',
    type: 'campanha', status: 'enviado', version: 1, preview: 'orange', at: iso(-1),
    caption: '5 formatos para Meta Ads (feed, stories, reels).',
    comments: [],
  },
  {
    id: 'ap3', title: 'Vídeo institucional — corte final', clientId: 'c5', projectId: 'pr5',
    type: 'video', status: 'enviado', version: 3, preview: 'green', at: iso(-4),
    caption: 'Corte de 90s com trilha e legendas. Aguardando aval final.',
    comments: [
      { id: 'x3', author: 'Dra. Lucía', fromClient: true, text: 'Ficou lindo. Vou mostrar pra equipe e retorno.', at: iso(-3) },
    ],
  },
  {
    id: 'ap4', title: 'Reels julho — lote 1', clientId: 'c3', projectId: 'pr3',
    type: 'post', status: 'aprovado', version: 1, preview: 'violet', at: iso(-2),
    caption: '3 reels roteirizados e editados.',
    comments: [
      { id: 'x4', author: 'Camila (Nauta)', fromClient: true, text: 'Aprovados! Podem publicar 👏', at: iso(-1) },
    ],
  },
  {
    id: 'ap5', title: 'Landing — wireframe', clientId: 'c4', projectId: 'pr4',
    type: 'landing', status: 'enviado', version: 1, preview: 'sky', at: iso(0),
    caption: 'Estrutura da página do lançamento residencial.',
    comments: [],
  },
]

// ── FINANCEIRO ───────────────────────────────────────────────
export interface DemoFinance {
  id: string; clientId: string; description: string; type: FinanceType
  amount: number; due: string; status: FinanceStatus
}
export const GINGA_FINANCE: DemoFinance[] = [
  { id: 'f1', clientId: 'c1', description: 'Contrato mensal — julho',     type: 'contrato_mensal', amount: 42000, due: iso(4),  status: 'pendente' },
  { id: 'f2', clientId: 'c2', description: 'Contrato mensal — julho',     type: 'contrato_mensal', amount: 28000, due: iso(-1), status: 'atrasado' },
  { id: 'f3', clientId: 'c3', description: 'Contrato mensal — julho',     type: 'contrato_mensal', amount: 18000, due: iso(6),  status: 'pendente' },
  { id: 'f4', clientId: 'c4', description: 'Contrato mensal — julho',     type: 'contrato_mensal', amount: 55000, due: iso(-6), status: 'pago' },
  { id: 'f5', clientId: 'c4', description: 'Produção de vídeo (avulso)',  type: 'avulso',          amount: 35000, due: iso(10), status: 'pendente' },
  { id: 'f6', clientId: 'c5', description: 'Contrato mensal — julho',     type: 'contrato_mensal', amount: 36000, due: iso(2),  status: 'pendente' },
  { id: 'f7', clientId: 'c1', description: 'Sessão de fotos (avulso)',    type: 'avulso',          amount: 12000, due: iso(-12),status: 'pago' },
]

// ── PIPELINE COMERCIAL (leads) ───────────────────────────────
export interface DemoLead {
  id: string; name: string; company: string; phone: string; value: number
  stage: LeadStage; memberId: string; source: string; notes?: string; days: number
}
export const GINGA_LEADS: DemoLead[] = [
  { id: 'l1', name: 'Paola Ramírez',  company: 'Dulce Vida',      phone: '5215511223344', value: 22000, stage: 'novo',       memberId: 'g6', source: 'Indicação', days: 1 },
  { id: 'l2', name: 'Héctor Molina',  company: 'Molina Abogados', phone: '5215522334455', value: 30000, stage: 'em_contato', memberId: 'g6', source: 'Instagram', days: 3 },
  { id: 'l3', name: 'Iván Castillo',  company: 'Nube Fitness',    phone: '5215566778899', value: 26000, stage: 'reuniao',    memberId: 'g1', source: 'Site',      days: 2, notes: 'Reunião marcada p/ quinta 15h.' },
  { id: 'l4', name: 'Lucía Fuentes',  company: 'Spa Serenity',    phone: '5215533445566', value: 24000, stage: 'proposta',   memberId: 'g1', source: 'Indicação', days: 6, notes: 'Proposta enviada, aguardando retorno.' },
  { id: 'l5', name: 'Roberto Chávez', company: 'Chávez Motors',   phone: '5215566770000', value: 48000, stage: 'negociacao', memberId: 'g1', source: 'LinkedIn',  days: 4, notes: 'Pediu desconto no semestral.' },
  { id: 'l6', name: 'Sofía Herrera',  company: 'Casa Lumen',      phone: '5215512345678', value: 42000, stage: 'fechado',    memberId: 'g2', source: 'Indicação', days: 0 },
  { id: 'l7', name: 'Marco Díaz',     company: 'Díaz Seguros',    phone: '5215599887766', value: 20000, stage: 'perdido',    memberId: 'g6', source: 'Frio',      days: 14, notes: 'Fechou com agência local.' },
]

// ── AGENDA DO DIA ────────────────────────────────────────────
export interface DemoAgendaItem {
  id: string; time: string; title: string; kind: 'reuniao' | 'entrega' | 'gravacao' | 'call' | 'interno'
  clientId: string | null; memberId: string
}
export const GINGA_AGENDA: DemoAgendaItem[] = [
  { id: 'a1', time: '09:30', title: 'Alinhamento semanal da equipe',     kind: 'interno',  clientId: null, memberId: 'g1' },
  { id: 'a2', time: '11:00', title: 'Reunião de aprovação — Casa Lumen', kind: 'reuniao',  clientId: 'c1', memberId: 'g2' },
  { id: 'a3', time: '13:00', title: 'Entrega criativos — Verde Market',  kind: 'entrega',  clientId: 'c2', memberId: 'g3' },
  { id: 'a4', time: '15:00', title: 'Call comercial — Nube Fitness',     kind: 'call',     clientId: 'c7', memberId: 'g1' },
  { id: 'a5', time: '16:30', title: 'Gravação vídeo — Clínica Aurora',   kind: 'gravacao', clientId: 'c5', memberId: 'g5' },
]

// ── CALENDÁRIO EDITORIAL ─────────────────────────────────────
export interface DemoPost {
  id: string; title: string; clientId: string; channel: ContentChannel; status: ContentStatus; day: number
}
const md = (day: number) => day // dia do mês corrente

export const GINGA_POSTS: DemoPost[] = [
  { id: 'po1',  title: 'Reel — projeto assinatura',   clientId: 'c1', channel: 'instagram', status: 'publicado', day: md(2) },
  { id: 'po2',  title: 'Carrossel — antes & depois',  clientId: 'c1', channel: 'instagram', status: 'agendado',  day: md(4) },
  { id: 'po3',  title: 'Story — bastidores',          clientId: 'c1', channel: 'instagram', status: 'aprovado',  day: md(6) },
  { id: 'po4',  title: 'Post — linha de inverno',     clientId: 'c2', channel: 'facebook',  status: 'aprovacao', day: md(3) },
  { id: 'po5',  title: 'Reel — receita saudável',     clientId: 'c2', channel: 'tiktok',    status: 'rascunho',  day: md(8) },
  { id: 'po6',  title: 'Reel — novo cardápio',        clientId: 'c3', channel: 'instagram', status: 'agendado',  day: md(5) },
  { id: 'po7',  title: 'Vídeo — tour cafeteria',      clientId: 'c3', channel: 'youtube',   status: 'aprovacao', day: md(10) },
  { id: 'po8',  title: 'Post — lançamento imóvel',    clientId: 'c4', channel: 'linkedin',  status: 'aprovado',  day: md(7) },
  { id: 'po9',  title: 'Carrossel — plantas',         clientId: 'c4', channel: 'instagram', status: 'rascunho',  day: md(12) },
  { id: 'po10', title: 'Reel — dica de skincare',     clientId: 'c5', channel: 'instagram', status: 'agendado',  day: md(9) },
  { id: 'po11', title: 'Story — promoção',            clientId: 'c5', channel: 'instagram', status: 'rascunho',  day: md(14) },
  { id: 'po12', title: 'Post — case de resultados',   clientId: 'c4', channel: 'linkedin',  status: 'aprovacao', day: md(15) },
]

// ── IA ATLAS — alertas operacionais ──────────────────────────
export interface DemoAtlasAlert {
  id: string; kind: AtlasAlertKind; severity: AtlasSeverity
  title: string; body: string; href: string | null; entity: string | null
}
export const GINGA_ALERTS: DemoAtlasAlert[] = [
  { id: 'al1', kind: 'aprovacao_parada',        severity: 'urgente',      title: 'Aprovação parada há 4 dias',      body: 'O corte final do vídeo da Clínica Aurora aguarda aprovação desde sexta. Sugiro um lembrete no WhatsApp.', href: '/aprovacoes', entity: 'Clínica Aurora' },
  { id: 'al2', kind: 'projeto_atrasado',        severity: 'atencao',      title: 'Projeto passou do prazo',         body: 'O "Vídeo institucional" da Clínica Aurora venceu há 2 dias e está 90% pronto — falta só o aval do cliente.', href: '/projetos', entity: 'Clínica Aurora' },
  { id: 'al3', kind: 'campanha_prazo',          severity: 'urgente',      title: 'Campanha entra no ar em 3 dias',  body: 'A "Campanha inverno MX" da Verde Market precisa dos criativos aprovados hoje para subir no prazo.', href: '/aprovacoes', entity: 'Verde Market' },
  { id: 'al4', kind: 'designer_sobrecarregado', severity: 'atencao',      title: 'Regina está sobrecarregada',      body: 'Regina tem 4 tarefas de alta prioridade nesta semana. Considere redistribuir a arte do menu digital.', href: '/operacao', entity: 'Regina Salas' },
  { id: 'al5', kind: 'proposta_parada',         severity: 'atencao',      title: 'Proposta parada no funil',        body: 'A proposta do Spa Serenity (MX$ 24.000/mês) está há 6 dias sem movimento. Vale um follow-up.', href: '/comercial', entity: 'Spa Serenity' },
  { id: 'al6', kind: 'upsell',                  severity: 'oportunidade', title: 'Oportunidade de upsell',          body: 'A Casa Lumen tem alto engajamento e ainda não contrata tráfego pago. Boa hora para propor performance.', href: '/growth', entity: 'Casa Lumen' },
  { id: 'al7', kind: 'cliente_sem_contato',     severity: 'atencao',      title: 'Cliente sem contato há 42 dias',  body: 'A Fuego Cantina está pausada e sem interação. Uma reativação pode trazer o contrato de volta.', href: '/growth', entity: 'Fuego Cantina' },
]

// ─────────────────────────────────────────────────────────────
// META — rótulos, cores e ordens
// ─────────────────────────────────────────────────────────────
export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; dot: string; chip: string }> = {
  planejamento:      { label: 'Planejamento',      dot: 'bg-slate-400',   chip: 'bg-slate-500/15 text-slate-300' },
  producao:          { label: 'Em produção',       dot: 'bg-amber-400',   chip: 'bg-amber-500/15 text-amber-300' },
  revisao_interna:   { label: 'Revisão interna',   dot: 'bg-violet-400',  chip: 'bg-violet-500/15 text-violet-300' },
  aguardando_cliente:{ label: 'Aguardando cliente',dot: 'bg-sky-400',     chip: 'bg-sky-500/15 text-sky-300' },
  aprovado:          { label: 'Aprovado',          dot: 'bg-emerald-400', chip: 'bg-emerald-500/15 text-emerald-300' },
  finalizado:        { label: 'Finalizado',        dot: 'bg-zinc-400',    chip: 'bg-zinc-500/15 text-zinc-300' },
  pausado:           { label: 'Pausado',           dot: 'bg-zinc-500',    chip: 'bg-zinc-600/20 text-zinc-400' },
}
export const PROJECT_STATUS_ORDER: ProjectStatus[] = ['planejamento', 'producao', 'revisao_interna', 'aguardando_cliente', 'aprovado', 'finalizado', 'pausado']

export const PRIORITY_META: Record<Priority, { label: string; chip: string; dot: string }> = {
  baixa:   { label: 'Baixa',   chip: 'bg-zinc-500/15 text-zinc-400',   dot: 'bg-zinc-400' },
  media:   { label: 'Média',   chip: 'bg-sky-500/15 text-sky-300',     dot: 'bg-sky-400' },
  alta:    { label: 'Alta',    chip: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-400' },
  urgente: { label: 'Urgente', chip: 'bg-rose-500/15 text-rose-300',   dot: 'bg-rose-400' },
}

export const OP_STATUS_META: Record<OpTaskStatus, { label: string; dot: string }> = {
  a_fazer:              { label: 'A fazer',               dot: 'bg-slate-400' },
  producao:             { label: 'Em produção',          dot: 'bg-amber-400' },
  revisao_interna:      { label: 'Revisão interna',      dot: 'bg-violet-400' },
  aguardando_aprovacao: { label: 'Aguardando aprovação', dot: 'bg-sky-400' },
  ajustes:              { label: 'Ajustes solicitados',  dot: 'bg-rose-400' },
  concluido:            { label: 'Concluído',            dot: 'bg-emerald-400' },
}
export const OP_STATUS_ORDER: OpTaskStatus[] = ['a_fazer', 'producao', 'revisao_interna', 'aguardando_aprovacao', 'ajustes', 'concluido']

export const OP_TYPE_META: Record<OpTaskType, { label: string; emoji: string }> = {
  arte:     { label: 'Arte',     emoji: '🎨' },
  video:    { label: 'Vídeo',    emoji: '🎬' },
  copy:     { label: 'Copy',     emoji: '✍️' },
  trafego:  { label: 'Tráfego',  emoji: '🎯' },
  reuniao:  { label: 'Reunião',  emoji: '🤝' },
  campanha: { label: 'Campanha', emoji: '📣' },
  site:     { label: 'Site',     emoji: '💻' },
  social:   { label: 'Social',   emoji: '📱' },
}

export const APPROVAL_STATUS_META: Record<ApprovalStatus, { label: string; chip: string; dot: string }> = {
  enviado:   { label: 'Enviado p/ aprovação', chip: 'bg-sky-500/15 text-sky-300',        dot: 'bg-sky-400' },
  aprovado:  { label: 'Aprovado',             chip: 'bg-emerald-500/15 text-emerald-300',dot: 'bg-emerald-400' },
  alteracao: { label: 'Alteração solicitada', chip: 'bg-amber-500/15 text-amber-300',    dot: 'bg-amber-400' },
  reenviado: { label: 'Reenviado',            chip: 'bg-violet-500/15 text-violet-300',  dot: 'bg-violet-400' },
  finalizado:{ label: 'Finalizado',           chip: 'bg-zinc-500/15 text-zinc-300',      dot: 'bg-zinc-400' },
}

export const APPROVAL_TYPE_META: Record<ApprovalType, { label: string; emoji: string }> = {
  arte:      { label: 'Arte',      emoji: '🎨' },
  video:     { label: 'Vídeo',     emoji: '🎬' },
  copy:      { label: 'Copy',      emoji: '✍️' },
  campanha:  { label: 'Campanha',  emoji: '📣' },
  post:      { label: 'Post',      emoji: '📱' },
  story:     { label: 'Story',     emoji: '📸' },
  landing:   { label: 'Landing',   emoji: '💻' },
  documento: { label: 'Documento', emoji: '📄' },
}

/** Cores de preview dos materiais (mock visual — vira thumbnail real com upload). */
export const PREVIEW_GRADIENT: Record<string, string> = {
  gold:   'from-amber-400/80 to-orange-500/60',
  orange: 'from-orange-400/80 to-rose-500/60',
  green:  'from-emerald-400/80 to-teal-500/60',
  violet: 'from-violet-400/80 to-fuchsia-500/60',
  sky:    'from-sky-400/80 to-indigo-500/60',
}

export const FINANCE_STATUS_META: Record<FinanceStatus, { label: string; chip: string; dot: string }> = {
  pendente:  { label: 'Pendente',  chip: 'bg-amber-500/15 text-amber-300',    dot: 'bg-amber-400' },
  pago:      { label: 'Pago',      chip: 'bg-emerald-500/15 text-emerald-300',dot: 'bg-emerald-400' },
  atrasado:  { label: 'Atrasado',  chip: 'bg-rose-500/15 text-rose-300',      dot: 'bg-rose-400' },
  cancelado: { label: 'Cancelado', chip: 'bg-zinc-500/15 text-zinc-400',      dot: 'bg-zinc-500' },
}

export const ATLAS_SEVERITY_META: Record<AtlasSeverity, { label: string; chip: string; dot: string; ring: string }> = {
  info:        { label: 'Info',        chip: 'bg-zinc-500/15 text-zinc-300',       dot: 'bg-zinc-400',    ring: 'ring-zinc-500/30' },
  atencao:     { label: 'Atenção',     chip: 'bg-amber-500/15 text-amber-300',     dot: 'bg-amber-400',   ring: 'ring-amber-500/30' },
  urgente:     { label: 'Urgente',     chip: 'bg-rose-500/15 text-rose-300',       dot: 'bg-rose-400',    ring: 'ring-rose-500/30' },
  oportunidade:{ label: 'Oportunidade',chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400', ring: 'ring-emerald-500/30' },
}

export const STAGE_META: Record<LeadStage, { label: string; dot: string }> = {
  novo:       { label: 'Novo lead',       dot: 'bg-sky-400' },
  em_contato: { label: 'Em contato',      dot: 'bg-indigo-400' },
  reuniao:    { label: 'Reunião marcada', dot: 'bg-violet-400' },
  proposta:   { label: 'Proposta enviada',dot: 'bg-amber-400' },
  negociacao: { label: 'Em negociação',   dot: 'bg-orange-400' },
  fechado:    { label: 'Fechado',         dot: 'bg-emerald-400' },
  perdido:    { label: 'Perdido',         dot: 'bg-zinc-500' },
}
export const STAGE_ORDER: LeadStage[] = ['novo', 'em_contato', 'reuniao', 'proposta', 'negociacao', 'fechado', 'perdido']

// ── Helpers ──────────────────────────────────────────────────
export const isLate = (dueOrDeadline: string | null, done = false) =>
  !!dueOrDeadline && !done && dueOrDeadline < today()

export { iso as demoDate, today as demoToday }

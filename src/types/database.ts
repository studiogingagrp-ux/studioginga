import type { Role } from '@/lib/constants/roles'

export type WorkspacePlan = 'trial' | 'essencial' | 'pro' | 'premium'
export type WorkspaceStatus = 'ativa' | 'suspensa' | 'cancelada'

export type EventStatus =
  | 'agendado' | 'confirmado' | 'em_andamento'
  | 'finalizado' | 'cancelado' | 'nao_compareceu'

export type EventType =
  | 'reuniao' | 'call' | 'gravacao' | 'entrega' | 'interno' | 'pessoal' | 'bloqueio'

/** Quem pode ver o conteúdo do evento. */
export type EventVisibility = 'equipe' | 'privado'

export interface Workspace {
  id: string
  name: string
  slug: string
  legal_name: string | null
  cnpj: string | null
  logo_url: string | null
  brand_color: string | null
  domain: string | null
  phone: string | null
  whatsapp_instance: string | null
  plan: WorkspacePlan
  status: WorkspaceStatus
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  workspace_id: string | null
  role: Role
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  job_title: string | null
  agenda_color: string | null
  active: boolean
  created_at: string
  updated_at: string
}

/** Contato/cliente da agência — quem participa de reuniões e usa o link público. */
export interface Client {
  id: string
  workspace_id: string
  user_id: string | null
  full_name: string
  phone: string
  email: string | null
  company: string | null
  notes: string | null
  extra: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  workspace_id: string
  client_id: string | null
  member_id: string
  starts_at: string
  ends_at: string
  status: EventStatus
  type: EventType
  visibility: EventVisibility
  title: string | null
  notes: string | null
  call_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── PIPELINE COMERCIAL ──────────────────────────────────────
export type LeadStage = 'novo' | 'em_contato' | 'reuniao' | 'proposta' | 'negociacao' | 'fechado' | 'perdido'

export interface Lead {
  id: string
  workspace_id: string
  member_id: string | null
  name: string
  company: string | null
  phone: string | null
  value: number          // valor mensal estimado (moeda do workspace)
  stage: LeadStage
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── CAMPANHAS (tarefas por cliente) ─────────────────────────
export type TaskStatus = 'a_fazer' | 'fazendo' | 'revisao' | 'concluida'

export interface CampaignTask {
  id: string
  workspace_id: string
  client_id: string | null
  member_id: string
  title: string
  status: TaskStatus
  due_date: string | null
  tag: string | null
  created_at: string
  updated_at: string
}

// ─── CALENDÁRIO DE CONTEÚDO ──────────────────────────────────
export type ContentChannel = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin'
export type ContentStatus  = 'rascunho' | 'aprovacao' | 'aprovado' | 'agendado' | 'publicado'

export interface ContentPost {
  id: string
  workspace_id: string
  client_id: string | null
  member_id: string | null
  title: string
  channel: ContentChannel
  status: ContentStatus
  publish_date: string
  created_at: string
  updated_at: string
}

// ─── REUNIÃO INTERATIVA (pauta, notas, ações) ────────────────
export interface MeetingAgendaItem { id: string; text: string; done: boolean }
export interface MeetingActionItem { id: string; text: string; member_id: string | null; done: boolean }

export interface MeetingDetail {
  event_id: string
  call_url: string | null
  agenda: MeetingAgendaItem[]
  notes: string
  actions: MeetingActionItem[]
  updated_at: string
}

// ─── PROJETOS ────────────────────────────────────────────────
export type ProjectStatus =
  | 'planejamento' | 'producao' | 'revisao_interna'
  | 'aguardando_cliente' | 'aprovado' | 'finalizado' | 'pausado'

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente'

export interface Project {
  id: string
  workspace_id: string
  name: string
  client_id: string | null
  lead_id: string | null          // responsável (profile)
  team_ids: string[]              // equipe envolvida
  deadline: string | null
  status: ProjectStatus
  priority: Priority
  description: string | null
  progress: number                // 0–100
  created_at: string
  updated_at: string
}

// ─── KANBAN OPERACIONAL (tarefas da equipe) ──────────────────
export type OpTaskStatus =
  | 'a_fazer' | 'producao' | 'revisao_interna'
  | 'aguardando_aprovacao' | 'ajustes' | 'concluido'

export type OpTaskType =
  | 'arte' | 'video' | 'copy' | 'trafego' | 'reuniao' | 'campanha' | 'site' | 'social'

export interface OpTask {
  id: string
  workspace_id: string
  client_id: string | null
  project_id: string | null
  member_id: string
  title: string
  type: OpTaskType
  status: OpTaskStatus
  priority: Priority
  due_date: string | null
  created_at: string
  updated_at: string
}

// ─── CENTRAL DE APROVAÇÃO ────────────────────────────────────
export type ApprovalType =
  | 'arte' | 'video' | 'copy' | 'campanha' | 'post' | 'story' | 'landing' | 'documento'

export type ApprovalStatus =
  | 'enviado' | 'aprovado' | 'alteracao' | 'reenviado' | 'finalizado'

export interface ApprovalComment {
  id: string
  author: string
  from_client: boolean
  text: string
  created_at: string
}

export interface Approval {
  id: string
  workspace_id: string
  client_id: string | null
  project_id: string | null
  title: string
  type: ApprovalType
  status: ApprovalStatus
  version: number
  preview_url: string | null      // imagem/thumbnail
  caption: string | null
  comments: ApprovalComment[]
  created_at: string
  updated_at: string
}

// ─── FINANCEIRO ──────────────────────────────────────────────
export type FinanceType = 'contrato_mensal' | 'avulso'
export type FinanceStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado'

export interface FinanceEntry {
  id: string
  workspace_id: string
  client_id: string | null
  description: string
  type: FinanceType
  amount: number
  due_date: string
  status: FinanceStatus
  paid_at: string | null
  created_at: string
}

// ─── IA ATLAS — alertas operacionais ─────────────────────────
export type AtlasSeverity = 'info' | 'atencao' | 'urgente' | 'oportunidade'

export type AtlasAlertKind =
  | 'aprovacao_parada' | 'projeto_atrasado' | 'tarefa_sem_dono'
  | 'designer_sobrecarregado' | 'cliente_sem_contato' | 'proposta_parada'
  | 'campanha_prazo' | 'upsell' | 'publicacoes_sem_aprovar'

export interface AtlasAlert {
  id: string
  workspace_id: string
  kind: AtlasAlertKind
  severity: AtlasSeverity
  title: string
  body: string
  href: string | null             // deep-link para a tela relevante
  entity_label: string | null     // ex: cliente/projeto envolvido
  created_at: string
}

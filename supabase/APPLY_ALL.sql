-- Ginga Studio OS — schema completo (001..004)
-- Cole tudo no Supabase > SQL Editor > Run

-- ============================================================
-- 001_atlas_schema.sql
-- ============================================================
-- ============================================================
-- ATLAS AGENDA CENTER â€” Migration 001 (schema completo)
-- Multi-tenant: workspaces â†’ profiles / clients / events
-- PapÃ©is: super_admin Â· dono Â· membro Â· convidado
-- ============================================================

-- â”€â”€â”€ WORKSPACES (empresas) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.workspaces (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  legal_name        text,
  cnpj              text,
  logo_url          text,
  brand_color       text default '#4f46e5',
  domain            text,
  phone             text,
  whatsapp_instance text,
  plan              text not null default 'trial'  check (plan in ('trial','essencial','pro','premium')),
  status            text not null default 'ativa'  check (status in ('ativa','suspensa','cancelada')),
  settings          jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- â”€â”€â”€ PROFILES (usuÃ¡rios â€” espelha auth.users) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  role         text not null default 'membro' check (role in ('super_admin','dono','membro','convidado')),
  full_name    text not null,
  email        text,
  phone        text,           -- WhatsApp com DDI (robÃ´ Atlas identifica o membro por aqui)
  avatar_url   text,
  job_title    text,           -- funÃ§Ã£o na empresa (ex: Social Media)
  agenda_color text default '#4f46e5',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_profiles_workspace on public.profiles(workspace_id);
create index if not exists idx_profiles_phone     on public.profiles(phone);

-- â”€â”€â”€ CLIENTS (clientes/contatos da empresa) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  full_name    text not null,
  phone        text not null,  -- WhatsApp com DDI
  email        text,
  company      text,
  notes        text,
  extra        jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_clients_workspace on public.clients(workspace_id);
create index if not exists idx_clients_phone     on public.clients(workspace_id, phone);

-- â”€â”€â”€ EVENTS (agenda) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  member_id    uuid not null references public.profiles(id) on delete cascade,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  status       text not null default 'agendado'
               check (status in ('agendado','confirmado','em_andamento','finalizado','cancelado','nao_compareceu')),
  type         text not null default 'reuniao'
               check (type in ('reuniao','call','gravacao','entrega','interno','pessoal','bloqueio')),
  visibility   text not null default 'equipe' check (visibility in ('equipe','privado')),
  title        text,
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_events_workspace_date on public.events(workspace_id, starts_at);
create index if not exists idx_events_member         on public.events(member_id, starts_at);
create index if not exists idx_events_client         on public.events(client_id);

-- â”€â”€â”€ WHATSAPP MESSAGES (histÃ³rico do robÃ´/central) â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.whatsapp_messages (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  phone        text not null,
  name         text,
  body         text not null,
  direction    text not null check (direction in ('in','out')),
  status       text default 'delivered',
  received_at  timestamptz not null default now(),
  created_at   timestamptz default now()
);

create index if not exists idx_whatsapp_messages_phone     on public.whatsapp_messages(phone);
create index if not exists idx_whatsapp_messages_workspace on public.whatsapp_messages(workspace_id);

-- â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create or replace function public.get_workspace_id() returns uuid
language sql stable security definer set search_path = public as $$
  select workspace_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.get_role() = 'super_admin', false)
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.get_role() = 'dono', false)
$$;

-- updated_at automÃ¡tico
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$ begin
  create trigger trg_workspaces_touch before update on public.workspaces
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_profiles_touch before update on public.profiles
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_clients_touch before update on public.clients
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_events_touch before update on public.events
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- â”€â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.workspaces        enable row level security;
alter table public.profiles          enable row level security;
alter table public.clients           enable row level security;
alter table public.events            enable row level security;
alter table public.whatsapp_messages enable row level security;

-- WORKSPACES: membros veem o prÃ³prio; super_admin vÃª todos
do $$ begin
  create policy "workspaces_select" on public.workspaces for select
    using (id = public.get_workspace_id() or public.is_super_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "workspaces_update_owner" on public.workspaces for update
    using ((id = public.get_workspace_id() and public.is_owner()) or public.is_super_admin());
exception when duplicate_object then null; end $$;

-- PROFILES: mesmo workspace lÃª; o prÃ³prio usuÃ¡rio ou o dono editam
do $$ begin
  create policy "profiles_select" on public.profiles for select
    using (workspace_id = public.get_workspace_id() or id = auth.uid() or public.is_super_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_update" on public.profiles for update
    using (id = auth.uid()
      or (workspace_id = public.get_workspace_id() and public.is_owner())
      or public.is_super_admin());
exception when duplicate_object then null; end $$;

-- CLIENTS: dono e membros do workspace operam
do $$ begin
  create policy "clients_select" on public.clients for select
    using (workspace_id = public.get_workspace_id() or public.is_super_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "clients_write" on public.clients for insert
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "clients_update" on public.clients for update
    using (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "clients_delete" on public.clients for delete
    using (workspace_id = public.get_workspace_id() and public.get_role() in ('dono','membro'));
exception when duplicate_object then null; end $$;

-- EVENTS: workspace lÃª tudo (a mÃ¡scara de privacidade Ã© aplicada na aplicaÃ§Ã£o;
-- o conteÃºdo privado nunca Ã© exibido para quem nÃ£o Ã© o dono do evento).
-- Escrita: membro cria/edita os prÃ³prios; dono edita todos.
do $$ begin
  create policy "events_select" on public.events for select
    using (workspace_id = public.get_workspace_id() or public.is_super_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "events_insert" on public.events for insert
    with check (workspace_id = public.get_workspace_id()
      and (member_id = auth.uid() or public.is_owner()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "events_update" on public.events for update
    using (workspace_id = public.get_workspace_id()
      and (member_id = auth.uid() or public.is_owner()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "events_delete" on public.events for delete
    using (workspace_id = public.get_workspace_id()
      and (member_id = auth.uid() or public.is_owner()));
exception when duplicate_object then null; end $$;

-- WHATSAPP MESSAGES
do $$ begin
  create policy "whatsapp_select" on public.whatsapp_messages for select
    using (workspace_id = public.get_workspace_id() or public.is_super_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "whatsapp_insert" on public.whatsapp_messages for insert
    with check (workspace_id = public.get_workspace_id() or workspace_id is null);
exception when duplicate_object then null; end $$;


-- ============================================================
-- 002_seed_estevam.sql
-- ============================================================
-- ============================================================
-- ATLAS AGENDA CENTER â€” Migration 002 (seed do 1Âº cliente)
-- Workspace do Estevam (empresa de marketing).
--
-- IMPORTANTE antes de rodar:
--   1. Crie os usuÃ¡rios em Authentication â†’ Add user (Estevam + equipe).
--   2. Substitua os UUIDs abaixo pelos IDs reais de auth.users.
-- ============================================================

insert into public.workspaces (id, name, slug, brand_color, whatsapp_instance, plan, status)
values (
  '11111111-1111-1111-1111-111111111111',
  'Estevam Marketing',
  'estevam',
  '#4f46e5',
  'atlas_estevam',
  'pro',
  'ativa'
)
on conflict (slug) do nothing;

-- â”€â”€ Perfis (troque os UUIDs pelos de auth.users) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- insert into public.profiles (id, workspace_id, role, full_name, email, phone, job_title, agenda_color)
-- values
--   ('<UUID_ESTEVAM>', '11111111-1111-1111-1111-111111111111', 'dono',   'Estevam',         'estevam@...', '52155XXXXXXXX', 'Dono Â· DireÃ§Ã£o', '#f59e0b'),
--   ('<UUID_MEMBRO1>', '11111111-1111-1111-1111-111111111111', 'membro', 'Nome do membro',  'membro@...',  '52155XXXXXXXX', 'Social Media',   '#3b82f6');


-- ============================================================
-- 003_atlas_marketing.sql
-- ============================================================
-- ============================================================
-- ATLAS AGENDA CENTER â€” Migration 003 (mÃ³dulos de marketing)
-- Pipeline comercial Â· Campanhas (tarefas) Â· CalendÃ¡rio de conteÃºdo
-- ReuniÃµes interativas (pauta/notas/aÃ§Ãµes) Â· call_url em events
-- ============================================================

-- â”€â”€â”€ EVENTS: link da call â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.events add column if not exists call_url text;

-- â”€â”€â”€ LEADS (pipeline comercial) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_id    uuid references public.profiles(id) on delete set null,
  name         text not null,
  company      text,
  phone        text,
  value        numeric(12,2) not null default 0,
  stage        text not null default 'novo'
               check (stage in ('novo','contato','proposta','negociacao','fechado','perdido')),
  notes        text,
  stage_since  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_leads_workspace_stage on public.leads(workspace_id, stage);

-- â”€â”€â”€ TASKS (campanhas) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  member_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  status       text not null default 'a_fazer'
               check (status in ('a_fazer','fazendo','revisao','concluida')),
  due_date     date,
  tag          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_tasks_workspace_status on public.tasks(workspace_id, status);
create index if not exists idx_tasks_member on public.tasks(member_id, due_date);

-- â”€â”€â”€ CONTENT POSTS (calendÃ¡rio de conteÃºdo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.content_posts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  member_id    uuid references public.profiles(id) on delete set null,
  title        text not null,
  channel      text not null default 'instagram'
               check (channel in ('instagram','facebook','tiktok','youtube','linkedin')),
  status       text not null default 'rascunho'
               check (status in ('rascunho','aprovacao','aprovado','agendado','publicado')),
  publish_date date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_content_workspace_date on public.content_posts(workspace_id, publish_date);

-- â”€â”€â”€ MEETING DETAILS (pauta, notas, aÃ§Ãµes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.meeting_details (
  event_id     uuid primary key references public.events(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  call_url     text,
  agenda       jsonb not null default '[]',   -- [{id,text,done}]
  notes        text not null default '',
  actions      jsonb not null default '[]',   -- [{id,text,member_id,done}]
  updated_at   timestamptz not null default now()
);

-- â”€â”€â”€ Triggers updated_at â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
do $$ begin
  create trigger trg_leads_touch before update on public.leads
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_tasks_touch before update on public.tasks
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_content_touch before update on public.content_posts
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_meeting_touch before update on public.meeting_details
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- â”€â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.leads           enable row level security;
alter table public.tasks           enable row level security;
alter table public.content_posts   enable row level security;
alter table public.meeting_details enable row level security;

do $$ begin
  create policy "leads_all" on public.leads for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "tasks_all" on public.tasks for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "content_all" on public.content_posts for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "meeting_all" on public.meeting_details for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;


-- ============================================================
-- 004_ginga_agency.sql
-- ============================================================
-- ============================================================
-- GINGA ESTÃšDIO OS â€” Migration 004 (mÃ³dulos de agÃªncia)
-- Projetos Â· Kanban operacional Â· AprovaÃ§Ãµes Â· Financeiro Â· Atlas alerts
-- Depende de 001 (workspaces, profiles, clients, helpers get_workspace_id/is_super_admin)
-- ============================================================

-- â”€â”€â”€ PROJETOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  lead_id      uuid references public.profiles(id) on delete set null,   -- responsÃ¡vel
  team_ids     uuid[] not null default '{}',
  name         text not null,
  description  text,
  deadline     date,
  status       text not null default 'planejamento'
               check (status in ('planejamento','producao','revisao_interna','aguardando_cliente','aprovado','finalizado','pausado')),
  priority     text not null default 'media' check (priority in ('baixa','media','alta','urgente')),
  progress     int  not null default 0 check (progress between 0 and 100),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_projects_workspace on public.projects(workspace_id, status);

-- â”€â”€â”€ KANBAN OPERACIONAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.op_tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null,
  member_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  type         text not null default 'arte'
               check (type in ('arte','video','copy','trafego','reuniao','campanha','site','social')),
  status       text not null default 'a_fazer'
               check (status in ('a_fazer','producao','revisao_interna','aguardando_aprovacao','ajustes','concluido')),
  priority     text not null default 'media' check (priority in ('baixa','media','alta','urgente')),
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_op_tasks_workspace on public.op_tasks(workspace_id, status);
create index if not exists idx_op_tasks_project on public.op_tasks(project_id);

-- â”€â”€â”€ CENTRAL DE APROVAÃ‡ÃƒO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.approvals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null,
  title        text not null,
  type         text not null default 'arte'
               check (type in ('arte','video','copy','campanha','post','story','landing','documento')),
  status       text not null default 'enviado'
               check (status in ('enviado','aprovado','alteracao','reenviado','finalizado')),
  version      int  not null default 1,
  preview_url  text,
  caption      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_approvals_workspace on public.approvals(workspace_id, status);

create table if not exists public.approval_comments (
  id           uuid primary key default gen_random_uuid(),
  approval_id  uuid not null references public.approvals(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author       text not null,
  from_client  boolean not null default false,
  text         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_approval_comments on public.approval_comments(approval_id);

-- â”€â”€â”€ FINANCEIRO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.finance_entries (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  description  text not null,
  type         text not null default 'contrato_mensal' check (type in ('contrato_mensal','avulso')),
  amount       numeric(12,2) not null default 0,
  due_date     date not null,
  status       text not null default 'pendente' check (status in ('pendente','pago','atrasado','cancelado')),
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_finance_workspace on public.finance_entries(workspace_id, status);

-- â”€â”€â”€ IA ATLAS â€” alertas operacionais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.atlas_alerts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind         text not null,
  severity     text not null default 'info' check (severity in ('info','atencao','urgente','oportunidade')),
  title        text not null,
  body         text not null,
  href         text,
  entity_label text,
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists idx_atlas_alerts_workspace on public.atlas_alerts(workspace_id, resolved);

-- â”€â”€â”€ Triggers updated_at â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
do $$ begin
  create trigger trg_projects_touch  before update on public.projects  for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_op_tasks_touch  before update on public.op_tasks  for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_approvals_touch before update on public.approvals for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- â”€â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.projects          enable row level security;
alter table public.op_tasks          enable row level security;
alter table public.approvals         enable row level security;
alter table public.approval_comments enable row level security;
alter table public.finance_entries   enable row level security;
alter table public.atlas_alerts      enable row level security;

do $$ begin
  create policy "projects_all" on public.projects for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "op_tasks_all" on public.op_tasks for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "approvals_all" on public.approvals for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "approval_comments_all" on public.approval_comments for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "finance_all" on public.finance_entries for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "atlas_alerts_all" on public.atlas_alerts for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;



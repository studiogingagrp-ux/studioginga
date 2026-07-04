-- ============================================================
-- ATLAS AGENDA CENTER — Migration 003 (módulos de marketing)
-- Pipeline comercial · Campanhas (tarefas) · Calendário de conteúdo
-- Reuniões interativas (pauta/notas/ações) · call_url em events
-- ============================================================

-- ─── EVENTS: link da call ───────────────────────────────────
alter table public.events add column if not exists call_url text;

-- ─── LEADS (pipeline comercial) ─────────────────────────────
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

-- ─── TASKS (campanhas) ──────────────────────────────────────
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

-- ─── CONTENT POSTS (calendário de conteúdo) ─────────────────
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

-- ─── MEETING DETAILS (pauta, notas, ações) ──────────────────
create table if not exists public.meeting_details (
  event_id     uuid primary key references public.events(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  call_url     text,
  agenda       jsonb not null default '[]',   -- [{id,text,done}]
  notes        text not null default '',
  actions      jsonb not null default '[]',   -- [{id,text,member_id,done}]
  updated_at   timestamptz not null default now()
);

-- ─── Triggers updated_at ────────────────────────────────────
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

-- ─── RLS ────────────────────────────────────────────────────
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

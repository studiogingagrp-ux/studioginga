-- ============================================================
-- GINGA STUDIO OS — Migration 007
-- Pipeline (leads) · Propostas · Conteúdo (posts)
-- Depende de 001 (helpers get_workspace_id/is_super_admin) e 004
-- ============================================================

-- ─── PIPELINE COMERCIAL (leads) ──────────────────────────────
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_id    uuid references public.profiles(id) on delete set null,
  name         text not null,
  company      text,
  phone        text,
  value        numeric(12,2) not null default 0,
  stage        text not null default 'novo'
               check (stage in ('novo','em_contato','reuniao','proposta','negociacao','fechado','perdido')),
  source       text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_leads_workspace on public.leads(workspace_id, stage);

-- ─── PROPOSTAS ───────────────────────────────────────────────
create table if not exists public.proposals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  title        text not null,
  template     text,
  value        numeric(12,2) not null default 0,
  status       text not null default 'rascunho'
               check (status in ('rascunho','enviada','aceita','recusada')),
  items        jsonb not null default '[]',
  intro        text,
  validity     int not null default 15,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_proposals_workspace on public.proposals(workspace_id, status);

-- ─── CONTEÚDO (posts do calendário editorial) ────────────────
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  title        text not null,
  channel      text not null default 'instagram',
  status       text not null default 'rascunho'
               check (status in ('rascunho','aprovacao','aprovado','agendado','publicado')),
  scheduled_on date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_posts_workspace on public.posts(workspace_id, scheduled_on);

-- ─── Triggers updated_at ─────────────────────────────────────
do $$ begin
  create trigger trg_leads_touch     before update on public.leads     for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_proposals_touch before update on public.proposals for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_posts_touch     before update on public.posts     for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.leads     enable row level security;
alter table public.proposals enable row level security;
alter table public.posts     enable row level security;

do $$ begin
  create policy "leads_all" on public.leads for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "proposals_all" on public.proposals for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "posts_all" on public.posts for all
    using (workspace_id = public.get_workspace_id() or public.is_super_admin())
    with check (workspace_id = public.get_workspace_id());
exception when duplicate_object then null; end $$;

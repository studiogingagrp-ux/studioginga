-- ============================================================
-- GINGA ESTÚDIO OS — Migration 004 (módulos de agência)
-- Projetos · Kanban operacional · Aprovações · Financeiro · Atlas alerts
-- Depende de 001 (workspaces, profiles, clients, helpers get_workspace_id/is_super_admin)
-- ============================================================

-- ─── PROJETOS ────────────────────────────────────────────────
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  lead_id      uuid references public.profiles(id) on delete set null,   -- responsável
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

-- ─── KANBAN OPERACIONAL ──────────────────────────────────────
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

-- ─── CENTRAL DE APROVAÇÃO ────────────────────────────────────
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

-- ─── FINANCEIRO ──────────────────────────────────────────────
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

-- ─── IA ATLAS — alertas operacionais ─────────────────────────
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

-- ─── Triggers updated_at ─────────────────────────────────────
do $$ begin
  create trigger trg_projects_touch  before update on public.projects  for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_op_tasks_touch  before update on public.op_tasks  for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_approvals_touch before update on public.approvals for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

-- ─── RLS ─────────────────────────────────────────────────────
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

-- ============================================================
-- ATLAS AGENDA CENTER — Migration 001 (schema completo)
-- Multi-tenant: workspaces → profiles / clients / events
-- Papéis: super_admin · dono · membro · convidado
-- ============================================================

-- ─── WORKSPACES (empresas) ──────────────────────────────────
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

-- ─── PROFILES (usuários — espelha auth.users) ───────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  role         text not null default 'membro' check (role in ('super_admin','dono','membro','convidado')),
  full_name    text not null,
  email        text,
  phone        text,           -- WhatsApp com DDI (robô Atlas identifica o membro por aqui)
  avatar_url   text,
  job_title    text,           -- função na empresa (ex: Social Media)
  agenda_color text default '#4f46e5',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_profiles_workspace on public.profiles(workspace_id);
create index if not exists idx_profiles_phone     on public.profiles(phone);

-- ─── CLIENTS (clientes/contatos da empresa) ─────────────────
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

-- ─── EVENTS (agenda) ────────────────────────────────────────
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

-- ─── WHATSAPP MESSAGES (histórico do robô/central) ─────────
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

-- ─── HELPERS ────────────────────────────────────────────────
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

-- updated_at automático
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

-- ─── RLS ────────────────────────────────────────────────────
alter table public.workspaces        enable row level security;
alter table public.profiles          enable row level security;
alter table public.clients           enable row level security;
alter table public.events            enable row level security;
alter table public.whatsapp_messages enable row level security;

-- WORKSPACES: membros veem o próprio; super_admin vê todos
do $$ begin
  create policy "workspaces_select" on public.workspaces for select
    using (id = public.get_workspace_id() or public.is_super_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "workspaces_update_owner" on public.workspaces for update
    using ((id = public.get_workspace_id() and public.is_owner()) or public.is_super_admin());
exception when duplicate_object then null; end $$;

-- PROFILES: mesmo workspace lê; o próprio usuário ou o dono editam
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

-- EVENTS: workspace lê tudo (a máscara de privacidade é aplicada na aplicação;
-- o conteúdo privado nunca é exibido para quem não é o dono do evento).
-- Escrita: membro cria/edita os próprios; dono edita todos.
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

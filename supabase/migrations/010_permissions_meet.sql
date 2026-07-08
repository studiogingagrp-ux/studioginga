-- ============================================================
-- GINGA STUDIO OS — Migration 010
-- Permissões por usuário (estilo BelezaPro) + proteção do dono + Google Meet
-- ============================================================

-- Permissões por colaborador: null = padrão do papel (tudo do papel liberado);
-- objeto jsonb { "clientes": true, "financeiro": false, ... } = só o que estiver true.
alter table public.profiles
  add column if not exists permissions jsonb,
  add column if not exists protected   boolean not null default false;

-- Link de reunião (Google Meet) nos eventos
alter table public.events
  add column if not exists meet_link text;

-- O Estevam (dono principal) NUNCA pode ser excluído
update public.profiles set protected = true
where lower(email) = 'estevara2019@gmail.com';

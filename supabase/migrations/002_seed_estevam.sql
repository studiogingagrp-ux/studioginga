-- ============================================================
-- ATLAS AGENDA CENTER — Migration 002 (seed do 1º cliente)
-- Workspace do Estevam (empresa de marketing).
--
-- IMPORTANTE antes de rodar:
--   1. Crie os usuários em Authentication → Add user (Estevam + equipe).
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

-- ── Perfis (troque os UUIDs pelos de auth.users) ────────────
-- insert into public.profiles (id, workspace_id, role, full_name, email, phone, job_title, agenda_color)
-- values
--   ('<UUID_ESTEVAM>', '11111111-1111-1111-1111-111111111111', 'dono',   'Estevam',         'estevam@...', '52155XXXXXXXX', 'Dono · Direção', '#f59e0b'),
--   ('<UUID_MEMBRO1>', '11111111-1111-1111-1111-111111111111', 'membro', 'Nome do membro',  'membro@...',  '52155XXXXXXXX', 'Social Media',   '#3b82f6');

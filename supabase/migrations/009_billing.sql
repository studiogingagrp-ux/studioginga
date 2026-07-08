-- ============================================================
-- GINGA STUDIO OS — Migration 009
-- Cobrança da plataforma (Asaas): aviso de vencimento + bloqueio
-- ============================================================

alter table public.workspaces
  add column if not exists asaas_customer_id     text,
  add column if not exists asaas_subscription_id text,
  add column if not exists billing_due_date      date,
  add column if not exists billing_blocked       boolean not null default false,
  add column if not exists billing_payment_link  text;

-- Seed do workspace Ginga Studio (assinatura do Estevam — R$180/mês)
update public.workspaces set
  asaas_customer_id     = 'cus_000185519121',
  asaas_subscription_id = 'sub_cnlqnha37f8csgbd',
  billing_due_date      = '2026-08-05',
  billing_payment_link  = 'https://www.asaas.com/i/ybfwqy2d4izkc8q8'
where id = 'd9b220bf-c6b2-4d3c-a15f-26ba8950ea61';

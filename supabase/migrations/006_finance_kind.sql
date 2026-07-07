-- ============================================================
-- GINGA STUDIO OS — Migration 006
-- Finanças: distinguir contas a PAGAR vs a RECEBER + contato/fornecedor
-- ============================================================

alter table public.finance_entries
  add column if not exists kind text not null default 'receber'
    check (kind in ('receber', 'pagar'));

alter table public.finance_entries
  add column if not exists contact text;

create index if not exists idx_finance_kind on public.finance_entries(workspace_id, kind, status);

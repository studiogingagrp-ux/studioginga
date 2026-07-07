-- ============================================================
-- GINGA STUDIO OS — Migration 008
-- Corrige a tabela `leads` (herdada da fase de marketing / migration 003)
-- para o novo Pipeline Comercial:
--   1) adiciona a coluna `source` (origem do lead)
--   2) amplia o check de `stage` para incluir 'em_contato' e 'reuniao'
-- Idempotente — seguro rodar mais de uma vez.
-- ============================================================

alter table public.leads add column if not exists source text;

alter table public.leads drop constraint if exists leads_stage_check;
alter table public.leads add constraint leads_stage_check
  check (stage in ('novo','em_contato','reuniao','proposta','negociacao','fechado','perdido'));

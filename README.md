# Atlas Agenda Center

**Toda a sua equipe, uma visão só.** Agenda inteligente de equipe com privacidade real, link público de agendamento e robô Atlas no WhatsApp (pt/es).

Produto da árvore **GRP Tecnologia**. Primeiro cliente: Estevam (empresa de marketing, México).

## Funcionalidades

- **Visão Atlas** — agenda de todos os membros lado a lado, cor por pessoa, chips de filtro, drag-and-drop
- **Privacidade real** — evento privado aparece como "Ocupado" 🔒 para o resto do time (sem título, telefone ou detalhes)
- **3 papéis** — Dono (vê tudo), Membro (edita o seu, vê o do time), Convidado (só leitura)
- **Clientes** — cadastro rápido com WhatsApp internacional (DDI), busca, ficha com atalhos
- **Link público** (`/agendar/[slug]`) — cliente escolhe pessoa, dia e horário livre; confirmação automática no WhatsApp
- **Robô Atlas** — comandos em linguagem natural no WhatsApp: `agenda`, `marca reunião com X quinta 15h`, `cancela 15h amanhã`
- **Crons** — lembrete ao cliente (18h, dia anterior) e resumo diário da equipe para o dono (7h)
- **White-label multi-tenant** — workspaces com cor/logo próprios; super admin

## Stack

Next.js 16 · React 19 · Tailwind v4 · shadcn · Supabase (Postgres + Auth + RLS) · Evolution API (WhatsApp) · Vercel

## Rodando

```bash
npm install
npm run dev
```

Sem Supabase configurado roda em **modo demo** (dados fictícios, `NEXT_PUBLIC_DEMO_MODE=true`).

## Deploy (checklist)

1. Criar projeto Supabase (org GRP) e rodar `supabase/migrations/001_atlas_schema.sql` + `002_seed_estevam.sql`
2. Criar usuários em Authentication e preencher `profiles` (UUIDs no seed)
3. Instância `atlas_estevam` na Evolution API (VPS Hostinger) + webhook → `/api/webhook/evolution`
4. Env vars na Vercel (ver `.env.local`) e `CRON_SECRET`
5. Desligar `NEXT_PUBLIC_DEMO_MODE`

---
Desenvolvido por **GRP Tecnologia**

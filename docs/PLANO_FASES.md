# Ginga Studio OS — Plano de Fases (dados reais + cerejas)

> Estado atual: sistema **no ar** (gingastudio.net), login real, papéis
> Dono/Sócio/Colaborador, Painel do Dono (cobranças Asaas ao vivo), cobrança
> R$180 rodando, trocar senha, múltiplos donos. **Porém a maioria dos módulos
> mostra DADOS DE EXEMPLO.** As fases abaixo transformam a vitrine linda em
> **ferramenta operacional real** — cada coisa salva no banco, por agência
> (workspace), com isolamento RLS.

---

## 🟩 FASE 1 — Fundação operacional (o essencial pra tocar a agência)

Objetivo: o Dono cadastra e enxerga os **dados reais dele** no coração do sistema.

1. **Clientes (CRUD real)** — adicionar/editar/arquivar cliente; cada um gera
   seu portal real. Tabela `clients` já existe.
2. **Equipe/Usuários** — criar funcionário + múltiplos donos (✅ feito),
   ativar/desativar, remover, reenviar acesso. Validar ponta a ponta.
3. **Projetos (CRUD real)** — criar projeto (cliente, prazo, responsável,
   status, progresso). Tabela `projects` (migration 004 pronta).
4. **Finanças persistente** — contas a pagar/receber salvas por workspace.
   Tabela `finance_entries` (migration 004 pronta).
5. **Configurações real (white-label)** — nome/cor/logo da agência salvos no
   workspace; refletem em todo o sistema e no portal.

**Entrega F1:** clientes, equipe, projetos e finanças 100% reais.

---

## 🟦 FASE 2 — Operação completa (o dia a dia inteiro real)

6. **Operação (Kanban de tarefas real)** — `op_tasks` por workspace, drag&drop
   persistido, responsável e prazo.
7. **Aprovações + Portal do cliente real** — dono envia material, cliente
   aprova/pede ajuste/comenta de verdade (`approvals` + `approval_comments`).
8. **Agenda + Reuniões real** — eventos persistidos; recorrência gera os
   registros; ata salva e enviável.
9. **Propostas & Contratos** — salvar as propostas geradas, status
   (rascunho/enviada/aceita), histórico por cliente.
10. **Comercial/Pipeline (leads real)** — CRM com etapas persistidas e valor.
11. **Conteúdo (calendário editorial real)** — posts persistidos por cliente.
12. **Atlas IA lendo dados reais** — alertas gerados do workspace (aprovação
    parada, projeto atrasado, cliente sem contato, sócio sobrecarregado).

**Entrega F2:** agência 100% operacional dentro do sistema.

---

## 🍒 CEREJAS DO BOLO (o "uau" — diferencial de mercado)

- 🌎 **pt / es com bandeirinha** — Estevam é do México; tradução real e troca
  de idioma no menu (estrutura já preparada).
- 🤖 **Atlas IA de verdade (Anthropic API)** — briefing diário inteligente +
  responder perguntas do dono: "como está a Casa Lumen?", "quem tá
  sobrecarregado?", "fecha o mês positivo?".
- ✍️ **Assinatura digital de proposta/contrato** — o cliente aceita online, a
  proposta vira contrato e registra data/IP. Fecha negócio na hora.
- 🔔 **Notificações em tempo real (Supabase Realtime)** — "Casa Lumen aprovou o
  material" chega na hora pro dono, sem recarregar.
- 📎 **Upload real (Supabase Storage)** — materiais no portal, logo da agência,
  anexos de proposta/contrato.
- 📊 **Relatórios/BI reais** — gráficos de faturamento, projetos entregues,
  produtividade da equipe, taxa de aprovação.
- 📱 **App instalável (PWA)** reativado do jeito certo (sem o bug de cache).
- 🧭 **Tour guiado** no primeiro acesso do dono.
- 💬 **WhatsApp real (Evolution)** — confirmação de reunião, aviso de aprovação
  pendente, resumo do dia pra equipe.

---

## ▶️ Ordem sugerida (quando chegar em casa)
Fase 1 (1→5) em sequência → Fase 2 (6→12) → Cerejas priorizadas:
**Atlas IA real → i18n pt/es → notificações realtime → assinatura digital.**

Padrão SS: cada tela auditada ao vivo, isolamento por workspace garantido,
nada de "dado de exemplo" sobrando onde o Dono espera o dado real dele.

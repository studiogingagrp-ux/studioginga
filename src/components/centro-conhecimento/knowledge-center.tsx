'use client'

import { useState } from 'react'
import {
  Search, GraduationCap, ChevronDown, CalendarDays, MessageCircle, Users,
  Sparkles, Eye, Link2, HelpCircle, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'

interface Guide {
  title: string
  oque: string
  como: string
  boas: string
  erros: string
}
interface Category { id: string; label: string; icon: LucideIcon; guides: Guide[] }

const CATEGORIES: Category[] = [
  {
    id: 'visao-atlas', label: 'Visão Atlas', icon: Eye,
    guides: [
      { title: 'Toda a equipe em um calendário', oque: 'A Visão Atlas mostra a agenda de todos os membros lado a lado, cada um com sua cor. O dono enxerga tudo; cada membro vê a sua e a do time.', como: 'Use os chips coloridos no topo para filtrar quem aparece. Clique em um horário vago para criar; arraste um card para mover de horário ou de pessoa.', boas: 'Reserve uma cor fixa por pessoa — em segundos você bate o olho e sabe quem está ocupado.', erros: 'Evite mover eventos de outra pessoa sem avisar — o card mostra de quem é pela cor.' },
      { title: 'Eventos privados', oque: 'Eventos marcados como privados aparecem para o resto do time apenas como "Ocupado" 🔒 — sem título, telefone ou detalhes.', como: 'Ao criar o evento, escolha "Privado — só eu" no campo Visibilidade. Eventos do tipo Pessoal já nascem privados.', boas: 'Use para compromissos pessoais, análises internas e assuntos sensíveis do negócio.', erros: 'Lembre que o horário continua visível como ocupado — privacidade não é invisibilidade.' },
    ],
  },
  {
    id: 'whatsapp', label: 'WhatsApp e robô Atlas', icon: MessageCircle,
    guides: [
      { title: 'Robô Atlas por WhatsApp', oque: 'O Atlas entende comandos em linguagem natural (português e espanhol) direto no WhatsApp da empresa.', como: 'Envie "agenda" para ver seu dia, "marca reunião com Cliente X quinta 15h" para criar, "cancela 15h amanhã" para cancelar.', boas: 'O dono recebe também o resumo diário da agenda da equipe toda manhã, sem pedir.', erros: 'Cadastre o WhatsApp de cada membro no perfil — é assim que o Atlas sabe quem está falando.' },
      { title: 'Central de conversas', oque: 'Acompanhe as conversas com clientes sem sair do sistema, com histórico unificado.', como: 'Selecione a conversa, escreva ou use um template pronto e envie.', boas: 'Use os templates de confirmação e reagendamento para ganhar velocidade.', erros: 'Evite mensagens longas demais — seja claro e cordial.' },
    ],
  },
  {
    id: 'clientes', label: 'Clientes', icon: Users,
    guides: [
      { title: 'Cadastro rápido', oque: 'O cadastro foi pensado para ser feito em segundos.', como: 'Clique em "Novo cliente", preencha nome e WhatsApp (únicos obrigatórios) e salve. Empresa, e-mail e observações são opcionais.', boas: 'Sempre salve o WhatsApp com DDI (+52 México, +55 Brasil) — é o que liga o cliente às confirmações automáticas.', erros: 'Telefone sem DDI quebra o envio de mensagens internacionais.' },
    ],
  },
  {
    id: 'link-publico', label: 'Link de agendamento', icon: Link2,
    guides: [
      { title: 'Clientes marcam sozinhos', oque: 'Cada empresa tem um link público onde o cliente escolhe a pessoa, o dia e o horário livre — sem vai-e-volta no WhatsApp.', como: 'Compartilhe o link /agendar/sua-empresa na bio, assinatura de e-mail e propostas. A reunião cai direto na agenda de quem atende.', boas: 'O cliente recebe confirmação e lembrete automáticos no WhatsApp.', erros: 'Horários já ocupados aparecem riscados — não há risco de conflito.' },
    ],
  },
  {
    id: 'automacoes', label: 'Automações', icon: Sparkles,
    guides: [
      { title: 'Confirmações e lembretes', oque: 'Mensagens automáticas reduzem no-show e melhoram a experiência do cliente.', como: 'Ative as automações desejadas (48h, 24h, 2h) na tela de Automações. Personalize os textos.', boas: 'Mantenha pelo menos a confirmação de 24h e o lembrete de 2h ativos.', erros: 'Não ative mensagens demais para o mesmo cliente — evite excesso.' },
    ],
  },
]

const FAQ = [
  { q: 'O que diferencia o Atlas de um Google Calendar?', a: 'A Visão Atlas (equipe toda em um calendário com privacidade real), o robô por WhatsApp em português/espanhol e o link público de agendamento com confirmação automática.' },
  { q: 'Funciona no celular e tablet?', a: 'Sim. É um PWA — pode ser instalado e usado como um app nativo no Android, iPhone, tablet e desktop.' },
  { q: 'Cada membro vê o que dos outros?', a: 'Vê a agenda do time normalmente, mas eventos privados dos colegas aparecem apenas como "Ocupado" 🔒, sem nenhum detalhe.' },
  { q: 'As mensagens de WhatsApp são automáticas?', a: 'Sim: confirmação na hora do agendamento, lembrete no dia anterior e resumo diário para o dono — além do robô Atlas para criar e consultar eventos.' },
]

export function KnowledgeCenter() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('visao-atlas')
  const [openGuide, setOpenGuide] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const cat = CATEGORIES.find((c) => c.id === activeCat)!
  const guides = cat.guides.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Centro de Conhecimento"
        subtitle="Guias práticos, boas práticas e perguntas frequentes"
      />

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-soft">
        <Search className="size-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar um guia…" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => { setActiveCat(c.id); setOpenGuide(null) }}
            className={cn('inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
              activeCat === c.id ? 'border-brand bg-accent/60 text-accent-foreground' : 'border-border bg-card text-muted-foreground hover:bg-secondary')}>
            <c.icon className={cn('size-4', activeCat === c.id && 'text-brand')} /> {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {guides.map((g) => {
          const open = openGuide === g.title
          return (
            <div key={g.title} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <button onClick={() => setOpenGuide(open ? null : g.title)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-accent text-brand"><GraduationCap className="size-4" /></span>
                  <span className="text-sm font-medium text-foreground">{g.title}</span>
                </span>
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
              </button>
              {open && (
                <div className="animate-rise grid gap-4 border-t border-border px-5 py-4 sm:grid-cols-2">
                  <Block label="O que é" text={g.oque} />
                  <Block label="Como usar" text={g.como} />
                  <Block label="Boas práticas" text={g.boas} />
                  <Block label="Erros comuns" text={g.erros} />
                </div>
              )}
            </div>
          )
        })}
        {guides.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum guia encontrado.</p>}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-foreground"><HelpCircle className="size-4 text-brand" /> Perguntas frequentes</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {FAQ.map((f, i) => {
            const open = openFaq === i
            return (
              <div key={i} className="border-b border-border/60 last:border-0">
                <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left">
                  <span className="text-sm font-medium text-foreground">{f.q}</span>
                  <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
                </button>
                {open && <p className="animate-rise px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3.5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">{label}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}

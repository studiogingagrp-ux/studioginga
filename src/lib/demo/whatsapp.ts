export type MsgDirection = 'in' | 'out'
export type MsgStatus = 'sent' | 'delivered' | 'read'

export interface DemoMessage {
  id: string
  direction: MsgDirection
  body: string
  time: string // 'HH:mm'
  status?: MsgStatus
  kind?: 'text' | 'image' | 'document'
}

export interface DemoConversation {
  id: string
  name: string
  phone: string
  initials: string
  lastAt: string
  unread: number
  tag?: 'confirmacao' | 'lembrete' | 'novo'
  messages: DemoMessage[]
}

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: 'c1', name: 'Dra. Sofía Herrera', phone: '5215512345678', initials: 'SH',
    lastAt: '08:05', unread: 1, tag: 'confirmacao',
    messages: [
      { id: 'm1', direction: 'out', body: '✅ *Reunião confirmada!* Olá, Sofía! Sua reunião com o Estevam está marcada para hoje às 09:00. Você receberá um lembrete antes do horário. 🚀', time: '08:01', status: 'read' },
      { id: 'm2', direction: 'in', body: '¡Perfecto! Estaré ahí. Gracias 🙌', time: '08:05' },
    ],
  },
  {
    id: 'c2', name: 'Ricardo Andrade', phone: '5215598765432', initials: 'RA',
    lastAt: '08:48', unread: 0, tag: 'lembrete',
    messages: [
      { id: 'm1', direction: 'out', body: 'Bom dia, Ricardo! Lembrete da sua call de resultados com o Diego hoje às 13:00. 🗓️', time: '07:30', status: 'delivered' },
      { id: 'm2', direction: 'in', body: 'Show! Consegue me mandar o relatório antes da call?', time: '08:48' },
    ],
  },
  {
    id: 'c3', name: 'Estevam · robô Atlas', phone: '5215500001111', initials: 'ES',
    lastAt: '07:00', unread: 0, tag: 'novo',
    messages: [
      { id: 'm1', direction: 'in', body: 'Atlas, agenda call com Grupo Andrade amanhã às 10:30', time: '06:59' },
      { id: 'm2', direction: 'out', body: '✅ *Criado!*\n\n📌 call com Grupo Andrade\n🗓 quinta às *10:30*\n\nJá está na sua agenda. 🚀', time: '07:00', status: 'read' },
    ],
  },
  {
    id: 'c4', name: 'Camila Torres', phone: '5215577778888', initials: 'CT',
    lastAt: 'Ontem', unread: 0,
    messages: [
      { id: 'm1', direction: 'out', body: 'Olá, Camila! O calendário editorial de julho foi entregue. Qualquer ajuste, estamos à disposição. 💙', time: '11:00', status: 'read' },
      { id: 'm2', direction: 'in', body: 'Ficou incrível, equipe nota 10! Obrigada ❤️', time: '11:42' },
    ],
  },
]

export const QUICK_TEMPLATES = [
  { label: 'Confirmar reunião', text: 'Olá! Confirmando sua reunião com a nossa equipe. Podemos confirmar sua presença?' },
  { label: 'Lembrete', text: 'Lembrete: sua reunião está agendada. Qualquer imprevisto, avise por aqui. 🗓️' },
  { label: 'Reagendar', text: 'Sem problemas! Me diz um dia e horário melhores pra você que a gente remarca. 😉' },
  { label: 'Agradecer', text: 'Obrigado pela confiança! Estamos à disposição. 💙' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Robô Atlas — entende comandos em linguagem natural via WhatsApp (pt/es).
// Parser puro (sem I/O) para ser testável; a execução fica no webhook.
// ─────────────────────────────────────────────────────────────────────────────

export type AtlasCommand =
  | { kind: 'agenda'; date: string }                                       // "agenda", "minha agenda amanhã"
  | { kind: 'create'; title: string; date: string; time: string; durationMin: number }
  | { kind: 'cancel'; date: string; time: string }                         // "cancela 15h amanhã"
  | { kind: 'confirm' }                                                    // cliente responde "sim"
  | { kind: 'help' }

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  segunda: 1, lunes: 1,
  terca: 2, terça: 2, martes: 2,
  quarta: 3, miercoles: 3, miércoles: 3,
  quinta: 4, jueves: 4,
  sexta: 5, viernes: 5,
  sabado: 6, sábado: 6,
}

const iso = (d: Date) => d.toISOString().split('T')[0]

/** Resolve expressões de dia ("hoje", "amanhã", "quinta", "05/07") para ISO. */
// Nota: \b do JS é ASCII — não funciona ao redor de palavras acentuadas (amanhã, às).
export function parseDay(text: string, now = new Date()): string | null {
  const t = text.toLowerCase()
  if (/(^|\s)(hoje|hoy)(\s|$|[,.!?])/.test(t)) return iso(now)
  if (/(amanh[aã]|ma[nñ]ana)/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate() + 1); return iso(d)
  }
  // dd/mm ou dd/mm/aaaa
  const dm = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (dm) {
    const year = dm[3] ? Number(dm[3].length === 2 ? `20${dm[3]}` : dm[3]) : now.getFullYear()
    const d = new Date(year, Number(dm[2]) - 1, Number(dm[1]))
    if (!Number.isNaN(d.getTime())) return iso(d)
  }
  // dia da semana → próxima ocorrência (inclusive hoje)
  for (const [name, dow] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${name}(-feira)?\\b`).test(t)) {
      const d = new Date(now)
      const delta = (dow - d.getDay() + 7) % 7
      d.setDate(d.getDate() + delta)
      return iso(d)
    }
  }
  return null
}

/** Resolve horários ("15h", "15:30", "às 9", "9h30") para 'HH:mm'. */
export function parseTime(text: string): string | null {
  const t = text.toLowerCase()
  const m =
    t.match(/\b(\d{1,2}):(\d{2})\b/) ??          // 15:30
    t.match(/\b(\d{1,2})h(\d{2})\b/) ??          // 15h30
    t.match(/\b(\d{1,2})\s*h(?:rs|s)?\b/) ??     // 15h / 15 hs
    t.match(/(?:^|\s)[àa]s?\s+(\d{1,2})\b/)      // às 15
  if (!m) return null
  const hh = Number(m[1])
  const mm = m[2] ? Number(m[2]) : 0
  if (hh > 23 || mm > 59) return null
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** Remove do título as partes que são comando/dia/hora. */
function extractTitle(text: string): string {
  return text
    .replace(/^\s*(atlas[,!]?\s*)?/i, '')
    .replace(/\b(marca(r)?|agenda(r)?|cria(r)?|agendar|apunta(r)?)\b/gi, '')
    .replace(/\b(reuni[aã]o|call|encontro|cita)\b\s*(com|con)?/gi, (m) => m) // mantém contexto no título
    .replace(/(hoje|hoy|amanh[aã]|ma[nñ]ana)/gi, '')
    .replace(/\b(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo|lunes|martes|miercoles|miércoles|jueves|viernes)(-feira)?\b/gi, '')
    .replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, '')
    .replace(/\b\d{1,2}:\d{2}\b/g, '')
    .replace(/\b\d{1,2}h(\d{2})?(rs|s)?\b/gi, '')
    .replace(/\b[àa]s?\s+\d{1,2}\b/gi, '')
    .replace(/\b(de|para|pra|el|la|no dia|dia)\b/gi, ' ')
    .replace(/(^|\s)[àa]s(\s|$)/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[,\s]+$/, '')
}

/**
 * Interpreta a mensagem de um MEMBRO da equipe.
 * Mensagens de clientes só passam por 'confirm'.
 */
export function parseCommand(text: string, now = new Date()): AtlasCommand | null {
  const t = text.trim().toLowerCase()
  if (!t) return null

  // Confirmação simples (cliente ou membro)
  if (/^(sim|si|s[íi]|confirmo|confirmar|ok|👍)$/i.test(t)) return { kind: 'confirm' }

  // Ajuda
  if (/^(ajuda|help|ayuda|comandos|\?)$/i.test(t)) return { kind: 'help' }

  const time = parseTime(t)
  const day  = parseDay(t, now)

  // Cancelamento primeiro — "desmarca" contém "marca" e cairia na criação.
  if (/\b(cancela(r)?|desmarca(r)?)\b/.test(t)) {
    if (time) return { kind: 'cancel', date: day ?? iso(now), time }
    return { kind: 'help' }
  }

  // Criação: verbo + dia + hora → "marca reunião com cliente X quinta 15h"
  if (/\b(marca(r)?|agenda(r)?|cria(r)?|apunta(r)?)\b/.test(t) && time && day) {
    const title = extractTitle(text) || 'Reunião'
    return { kind: 'create', title, date: day, time, durationMin: 60 }
  }

  // Consulta de agenda: "agenda", "minha agenda amanhã", "mi agenda"
  if (/\bagenda\b/.test(t)) {
    return { kind: 'agenda', date: day ?? iso(now) }
  }

  // Verbo de criação sem dia/hora completos → orienta o formato
  if (/\b(marca(r)?|cria(r)?|apunta(r)?)\b/.test(t)) return { kind: 'help' }

  return null
}

export const HELP_MESSAGE = [
  '🤖 *Atlas aqui!* Comandos que eu entendo:',
  '',
  '📅 *agenda* — sua agenda de hoje',
  '📅 *agenda amanhã* / *agenda quinta*',
  '➕ *marca reunião com [cliente] quinta 15h*',
  '❌ *cancela 15h amanhã*',
  '',
  '_Também aceito espanhol! / ¡También hablo español!_',
].join('\n')

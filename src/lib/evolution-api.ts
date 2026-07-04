const BASE  = process.env.EVOLUTION_API_URL?.replace(/\/$/, '') ?? ''
const KEY   = process.env.EVOLUTION_API_KEY ?? ''
const INST  = process.env.EVOLUTION_INSTANCE ?? 'atlas_estevam'

export function isEvolutionConfigured() {
  return BASE.startsWith('http') && !!KEY
}

async function evoFetch(path: string, options?: RequestInit) {
  if (!isEvolutionConfigured()) throw new Error('Evolution API not configured')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY,
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Evolution API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function sendText(phone: string, text: string) {
  const number = phone.replace(/\D/g, '')
  return evoFetch(`/message/sendText/${INST}`, {
    method: 'POST',
    body: JSON.stringify({ number, text }),
  })
}

export async function getInstanceStatus() {
  return evoFetch(`/instance/connectionState/${INST}`)
}

export async function fetchChats() {
  return evoFetch(`/chat/findChats/${INST}`, { method: 'POST', body: JSON.stringify({}) })
}

export async function fetchMessages(remoteJid: string, limit = 20) {
  return evoFetch(`/chat/findMessages/${INST}`, {
    method: 'POST',
    body: JSON.stringify({ where: { key: { remoteJid } }, limit }),
  })
}

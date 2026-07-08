// Sanitiza contra chars invisíveis nas envs (mesma causa raiz do bug de login).
const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim()
const BASE  = clean(process.env.EVOLUTION_API_URL || '').replace(/\/$/, '')
const KEY   = clean(process.env.EVOLUTION_API_KEY || '')
const INST  = clean(process.env.EVOLUTION_INSTANCE || '') || 'ginga_estevam'

export function isEvolutionConfigured() {
  return BASE.startsWith('http') && !!KEY
}
export function instanceName() { return INST }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function evoFetch(path: string, options?: RequestInit): Promise<any> {
  if (!isEvolutionConfigured()) throw new Error('Evolution API not configured')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY,
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  let json: unknown = null
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  if (!res.ok) {
    const err = new Error(`Evolution API ${res.status}`) as Error & { status?: number; body?: unknown }
    err.status = res.status
    err.body = json
    throw err
  }
  return json
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

// ─── Conexão via QR code ─────────────────────────────────────────────────────

/** Cria a instância (se ainda não existe). Idempotente: 403/409 = já existe. */
export async function createInstance() {
  try {
    return await evoFetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: INST,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    })
  } catch (e) {
    const err = e as Error & { status?: number }
    if (err.status === 403 || err.status === 409) return null // já existe
    throw e
  }
}

/**
 * Retorna o QR (base64) pra parear o número. Se a instância não existe, cria.
 * Formato: { state, base64?, pairingCode? }
 */
export async function getConnectionQr(): Promise<{ state: string; base64?: string; pairingCode?: string }> {
  // já conectado?
  try {
    const st = await getInstanceStatus()
    const state = st?.instance?.state
    if (state === 'open') return { state: 'open' }
  } catch (e) {
    const err = e as Error & { status?: number }
    if (err.status === 404) await createInstance() // instância não existe → cria
  }

  const conn = await evoFetch(`/instance/connect/${INST}`)
  const base64 = conn?.base64 || conn?.qrcode?.base64
  const pairingCode = conn?.pairingCode || conn?.qrcode?.pairingCode
  return { state: 'connecting', base64, pairingCode }
}

/** Desconecta o WhatsApp (logout da sessão). */
export async function logoutInstance() {
  return evoFetch(`/instance/logout/${INST}`, { method: 'DELETE' })
}

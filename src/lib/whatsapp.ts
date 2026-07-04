// Integração com a Evolution API (WhatsApp) — server-side, MULTI-TENANT.
// Cada empresa tem a própria instância (o próprio número).
// Configurar no .env.local (GLOBAL — é o seu servidor Evolution no VPS):
//   EVOLUTION_API_URL=http://SEU_IP:8080
//   EVOLUTION_API_KEY=sua_api_key_global
//
// Importante (aprendizado do BelezaPro): usar SEMPRE a imagem
// `evoapicloud/evolution-api` (não o antigo `atendai/...`) e mantê-la atualizada.

export function isWhatsappConfigured(): boolean {
  return !!process.env.EVOLUTION_API_URL && !!process.env.EVOLUTION_API_KEY
}

const baseUrl = () => process.env.EVOLUTION_API_URL!.replace(/\/$/, '')
const headers = () => ({
  'Content-Type': 'application/json',
  apikey: process.env.EVOLUTION_API_KEY!,
})

/** Nome da instância de um workspace (prefixo `atlas_`). */
export function instanceName(workspaceId: string): string {
  return `atlas_${workspaceId.replace(/-/g, '').slice(0, 16)}`
}

/** Instância padrão (v1: única por deploy, via env EVOLUTION_INSTANCE). */
export function defaultInstance(): string {
  return process.env.EVOLUTION_INSTANCE ?? ''
}

/** Envia texto pela instância padrão — usado por confirmações, lembretes e resumo diário. */
export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  return sendText(defaultInstance(), to, text)
}

/**
 * Normaliza um telefone para o formato da Evolution (DDI+DDD+número, só dígitos).
 * Números sem DDI ganham o DDI padrão do workspace (BR 55; México usa 52 — sempre
 * cadastrar clientes MX com DDI completo, ex: 5215512345678).
 */
export function normalizePhone(raw: string): string | null {
  let d = (raw ?? '').replace(/\D/g, '')
  if (!d) return null
  const defaultDdi = process.env.WHATSAPP_DEFAULT_DDI ?? '55'
  if (d.length <= 11) d = defaultDdi + d
  if (d.length < 12 || d.length > 13) return null
  return d
}

/** Cria a instância (idempotente). */
export async function createInstance(instance: string): Promise<void> {
  if (!isWhatsappConfigured()) return
  try {
    await fetch(`${baseUrl()}/instance/create`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ instanceName: instance, integration: 'WHATSAPP-BAILEYS', qrcode: true }),
    })
  } catch (err) {
    console.error('createInstance error:', err)
  }
}

/** QR Code (base64) para conectar a instância. */
export async function getQrCode(instance: string): Promise<string | null> {
  if (!isWhatsappConfigured()) return null
  try {
    const res = await fetch(`${baseUrl()}/instance/connect/${instance}`, { headers: headers() })
    if (!res.ok) return null
    const data = await res.json()
    return data?.base64 ?? data?.qrcode?.base64 ?? null
  } catch (err) {
    console.error('getQrCode error:', err)
    return null
  }
}

/** Estado da conexão: 'open' | 'connecting' | 'close' | null. */
export async function connectionState(instance: string): Promise<string | null> {
  if (!isWhatsappConfigured()) return null
  try {
    const res = await fetch(`${baseUrl()}/instance/connectionState/${instance}`, { headers: headers() })
    if (!res.ok) return null
    const data = await res.json()
    return data?.instance?.state ?? data?.state ?? null
  } catch (err) {
    console.error('connectionState error:', err)
    return null
  }
}

/** Envia mensagem de texto pela instância da empresa. */
export async function sendText(instance: string, to: string, text: string): Promise<boolean> {
  if (!isWhatsappConfigured() || !instance) return false
  const number = normalizePhone(to)
  if (!number) return false
  try {
    const res = await fetch(`${baseUrl()}/message/sendText/${instance}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ number, text }),
    })
    return res.ok
  } catch (err) {
    console.error('whatsapp sendText error:', err)
    return false
  }
}

type MediaType = 'image' | 'video' | 'document' | 'audio'

/** Envia mídia (imagem/vídeo/PDF/documento) por URL. */
export async function sendMedia(
  instance: string,
  to: string,
  mediatype: MediaType,
  url: string,
  caption?: string,
): Promise<boolean> {
  if (!isWhatsappConfigured() || !instance) return false
  const number = normalizePhone(to)
  if (!number) return false
  try {
    const res = await fetch(`${baseUrl()}/message/sendMedia/${instance}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ number, mediatype, media: url, caption }),
    })
    return res.ok
  } catch (err) {
    console.error('whatsapp sendMedia error:', err)
    return false
  }
}

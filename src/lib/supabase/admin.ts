import { createClient } from '@supabase/supabase-js'

// Sanitiza contra caracteres não-ASCII invisíveis que quebram os headers do
// fetch (mesma causa raiz do bug histórico de login — ver client.ts).
const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim()
const DEFAULT_URL = 'https://dhpocnjuxcpkxhpnjaep.supabase.co'

export function createAdminClient() {
  const rawUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  const url = rawUrl.startsWith('http') ? rawUrl : DEFAULT_URL
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY || '')
  if (!key) throw new Error('Supabase admin credentials not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

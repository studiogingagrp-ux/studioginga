import { createBrowserClient } from '@supabase/ssr'

// Valores PÚBLICOS (publishable) do Supabase da Ginga — seguros no navegador.
// Hardcoded como fallback contra o cache de build da Vercel.
const DEFAULT_URL = 'https://dhpocnjuxcpkxhpnjaep.supabase.co'
const DEFAULT_KEY = 'sb_publishable_FbRd4mEY54BeeVzJJGcR5Q_xW6kRaax'

// Remove qualquer caractere não-ASCII/invisível que quebra os headers do
// fetch ("String contains non ISO-8859-1 code point"). Blinda contra env
// com lixo invisível colado sem querer.
const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim()

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const SUPABASE_URL = clean(rawUrl).startsWith('http') ? clean(rawUrl) : DEFAULT_URL
const SUPABASE_KEY = clean(rawKey).length > 10 ? clean(rawKey) : DEFAULT_KEY

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 10
}

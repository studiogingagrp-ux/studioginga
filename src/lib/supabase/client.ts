import { createBrowserClient } from '@supabase/ssr'

// Valores PÚBLICOS (publishable) do Supabase da Ginga — seguros de expor
// no navegador (é o propósito da chave publishable). Ficam hardcoded como
// fallback pra blindar contra o cache de build da Vercel, que às vezes não
// inlina as variáveis NEXT_PUBLIC_* (deixava o login travado em "modo demo").
const DEFAULT_URL = 'https://dhpocnjuxcpkxhpnjaep.supabase.co'
const DEFAULT_KEY = 'sb_publishable_FbRd4mEY54BeeVzJJGcR5Q_xW6kRaax'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : DEFAULT_URL

const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 10
}

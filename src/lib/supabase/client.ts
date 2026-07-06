import { createBrowserClient } from '@supabase/ssr'

// Lê as variáveis públicas (inlined em build pelo Next).
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const RAW_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// URL válida como fallback para não quebrar a inicialização do módulo.
const SUPABASE_URL = RAW_URL.startsWith('http') ? RAW_URL : PLACEHOLDER_URL
const SUPABASE_KEY = RAW_KEY.length > 0 ? RAW_KEY : PLACEHOLDER_KEY

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL !== PLACEHOLDER_URL && SUPABASE_KEY !== PLACEHOLDER_KEY
}

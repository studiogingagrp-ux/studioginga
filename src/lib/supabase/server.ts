import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Sanitiza contra caracteres não-ASCII que quebram os headers do fetch.
const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim()
const DEFAULT_URL = 'https://dhpocnjuxcpkxhpnjaep.supabase.co'
const DEFAULT_KEY = 'sb_publishable_FbRd4mEY54BeeVzJJGcR5Q_xW6kRaax'
const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL || '').startsWith('http') ? clean(process.env.NEXT_PUBLIC_SUPABASE_URL || '') : DEFAULT_URL
const SUPABASE_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').length > 10 ? clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') : DEFAULT_KEY

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies definidos via proxy
          }
        },
      },
    }
  )
}

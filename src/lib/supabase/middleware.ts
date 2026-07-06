import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_COOKIE, homeForRole, type Role } from '@/lib/constants/roles'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const isSupabaseConfigured = supabaseUrl?.startsWith('http') && !!supabaseKey

// ─── Restrições de papel por prefixo de rota ─────────────────────────────────
// Só os papéis listados acessam; qualquer outro é redirecionado para sua home.
const RESTRICTED_TO: Record<string, Role[]> = {
  '/admin':         ['super_admin'],
  '/dashboard':     ['dono'],
  '/agenda':        ['dono', 'membro', 'convidado'],
  '/reuniao':       ['dono', 'membro'],
  '/pipeline':      ['dono', 'membro'],
  '/campanhas':     ['dono', 'membro'],
  '/conteudo':      ['dono', 'membro'],
  '/clientes':      ['dono', 'membro'],
  '/whatsapp':      ['dono'],
  '/agendamento':   ['dono'],
  '/automacoes':    ['dono'],
  '/equipe':        ['dono'],
  '/configuracoes': ['dono'],
  '/usuarios':      ['dono'],
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')

  // Rotas públicas: APIs/webhooks, agendamento público do cliente por link, offline.
  const isPublicRoute =
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||     // callback de link (convite/recuperação de senha)
    pathname.startsWith('/agendar') ||  // link público de agendamento por empresa
    pathname.startsWith('/portal') ||   // portal externo do cliente da agência
    pathname === '/offline' ||
    pathname === '/'

  // Não autenticado tentando rota privada → login
  // DEMO MODE: permitir acesso sem auth quando NEXT_PUBLIC_DEMO_MODE=true
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (!user && !isAuthRoute && !isPublicRoute && !isDemoMode) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const role = request.cookies.get(ROLE_COOKIE)?.value as Role | undefined

  // Autenticado em rota de auth → sua home
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = homeForRole(role)
    return NextResponse.redirect(url)
  }

  if (user && role) {
    const restricted = Object.entries(RESTRICTED_TO).find(([prefix]) =>
      pathname.startsWith(prefix)
    )
    if (restricted) {
      const [, allowed] = restricted
      if (!allowed.includes(role)) {
        const url = request.nextUrl.clone()
        url.pathname = homeForRole(role)
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

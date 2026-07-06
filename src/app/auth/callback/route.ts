import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Troca o código do link (convite / recuperação) por uma sessão e leva
// o usuário para definir a senha.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/definir-senha'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`)
}

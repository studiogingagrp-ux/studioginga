import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 renomeou `middleware.ts` → `proxy.ts`.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

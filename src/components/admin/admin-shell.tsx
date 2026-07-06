'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, CreditCard, ScrollText, LogOut, ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { ROLE_COOKIE } from '@/lib/constants/roles'
import { GrpCredit } from '@/components/brand/grp-credit'

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Cobranças', icon: CreditCard },
  { href: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { href: '/admin/planos', label: 'Planos', icon: LayoutDashboard },
  { href: '/admin/logs', label: 'Logs & Monitor', icon: ScrollText },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    if (isSupabaseConfigured()) await createClient().auth.signOut()
    document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-secondary/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-[oklch(0.24_0.008_75)] text-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient"><ShieldCheck className="size-5 text-brand-foreground" /></span>
          <div>
            <p className="text-sm font-semibold leading-none">Super Admin</p>
            <p className="text-[10px] text-white/50">GRP Tecnologia</p>
          </div>
        </div>
        <nav className="mt-4 flex-1 space-y-0.5 px-3">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href))
            return (
              <Link key={n.href} href={n.href}
                className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
                <n.icon className={cn('size-[18px]', active && 'text-brand')} /> {n.label}
              </Link>
            )
          })}
        </nav>
        <button onClick={logout} className="mx-3 mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white">
          <LogOut className="size-[18px]" /> Sair
        </button>
        <div className="px-3 pb-4"><GrpCredit variant="dark" className="text-left" /></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:hidden">
          <span className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="size-5 text-brand" /> Super Admin</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

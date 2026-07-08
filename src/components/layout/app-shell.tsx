'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, LogOut, ChevronsUpDown, Search, Sparkles, Crown, UserRound, Check } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { navSectionsForRole, navFooterForRole, type NavItem } from '@/lib/constants/nav'
import type { Permissions } from '@/lib/constants/features'
import { ROLES, ROLE_COOKIE, DEMO_ROLE_COOKIE, type Role } from '@/lib/constants/roles'
import { brandVars, type WorkspaceBranding } from '@/lib/branding'
import { Logo } from '@/components/brand/logo'
import { GrpCredit } from '@/components/brand/grp-credit'
import { NotificationBell } from '@/components/layout/notification-bell'
import { PageTransition } from '@/components/layout/page-transition'
import { CommandPalette, openCommandPalette, type CmdClient } from '@/components/layout/command-palette'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface Props {
  role: Role
  name: string
  workspaceName: string
  workspaceBranding?: WorkspaceBranding | null
  clients?: CmdClient[]
  permissions?: Permissions
  children: React.ReactNode
}

export function AppShell({ role, name, workspaceName, workspaceBranding, clients, permissions, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const vars = brandVars(workspaceBranding)
  const logoUrl = workspaceBranding?.logo_url ?? undefined

  return (
    <div className="ginga-grain relative flex min-h-screen bg-background" style={vars}>
      {/* atmosfera — glow de ouro no canto */}
      <div aria-hidden className="ginga-glow pointer-events-none fixed inset-0 z-0 opacity-70" />

      {/* Sidebar desktop */}
      <aside className="sticky top-0 z-20 hidden h-screen w-[266px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarBody role={role} permissions={permissions} workspaceName={workspaceName} logoUrl={logoUrl} />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="animate-rise absolute left-0 top-0 flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar">
            <SidebarBody role={role} permissions={permissions} workspaceName={workspaceName} logoUrl={logoUrl} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex flex-1 items-center lg:hidden">
            <Logo name={workspaceName} logoUrl={logoUrl} subtitle={false} className="scale-90 origin-left" />
          </div>

          <button
            onClick={openCommandPalette}
            className="hidden items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:bg-card sm:flex sm:w-80"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Buscar cliente, projeto, tarefa…</span>
            <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
          </button>

          <button
            onClick={openCommandPalette}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary sm:hidden"
            aria-label="Buscar"
          >
            <Search className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/atlas"
              className="hidden items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 sm:flex"
            >
              <Sparkles className="size-3.5" /> Atlas
            </Link>
            <NotificationBell />
            <UserMenu role={role} name={name} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <CommandPalette clients={clients} />
      <InstallPrompt />
    </div>
  )
}

function SidebarBody({
  role, permissions, workspaceName, logoUrl, onNavigate,
}: {
  role: Role
  permissions?: Permissions
  workspaceName: string
  logoUrl?: string
  onNavigate?: () => void
}) {
  const sections = navSectionsForRole(role, permissions)
  const footer = navFooterForRole(role, permissions)
  return (
    <>
      <div className="flex h-16 items-center px-5">
        <Logo name={workspaceName} logoUrl={logoUrl} />
      </div>

      {/* contexto da agência */}
      <div className="px-3">
        <div className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-card/40 px-3 py-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="truncate text-xs font-medium text-sidebar-foreground/80">{workspaceName}</span>
          <span className="ml-auto kicker text-muted-foreground/70">MX</span>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="kicker px-3 pb-1.5 text-muted-foreground/50">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border px-3 py-3">
        {footer.map((item) => <NavLink key={item.href} item={item} onNavigate={onNavigate} />)}
      </div>
      <div className="px-4 pb-4">
        <GrpCredit className="text-left" />
      </div>
    </>
  )
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const active = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/65 hover:bg-white/5 hover:text-sidebar-foreground',
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand" />}
      <Icon className={cn('size-[18px] transition-colors', active ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground')} />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

function UserMenu({ role, name }: { role: Role; name: string }) {
  const router = useRouter()
  const demo = !isSupabaseConfigured()

  async function logout() {
    if (isSupabaseConfigured()) await createClient().auth.signOut()
    document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`
    router.replace('/login')
    router.refresh()
  }

  function verComo(next: Role, home: string) {
    document.cookie = `${DEMO_ROLE_COOKIE}=${next}; path=/; max-age=31536000`
    router.push(home)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-2 py-1.5 text-left transition-colors hover:bg-card">
        <Avatar className="size-8">
          <AvatarFallback className="bg-brand-gradient text-xs text-brand-foreground">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden leading-tight sm:block">
          <p className="max-w-[140px] truncate text-sm font-medium text-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">{ROLES[role]?.label ?? 'Dono'}</p>
        </div>
        <ChevronsUpDown className="hidden size-4 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs font-normal text-muted-foreground">{ROLES[role]?.label ?? 'Dono'}</p>
        </DropdownMenuLabel>
        {demo && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Ver como
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => verComo('dono', '/dashboard')}>
              <Crown className="size-4 text-brand" /> Dono
              <span className="ml-auto text-muted-foreground">{role === 'dono' && <Check className="size-4 text-brand" />}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => verComo('membro', '/meu-dia')}>
              <UserRound className="size-4 text-sky-400" /> Colaborador
              <span className="ml-auto text-muted-foreground">{role === 'membro' && <Check className="size-4 text-brand" />}</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive">
          <LogOut className="size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

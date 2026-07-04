import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { brandVars, DEFAULT_BRAND, type WorkspaceSettings } from '@/lib/branding'
import { GrpCredit } from '@/components/brand/grp-credit'
import { LogoMark } from '@/components/brand/logo'

export const dynamic = 'force-dynamic'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Carrega branding da primeira empresa ativa (para a tela de login)
  let workspaceName   = 'Ginga Studio'
  let logoUrl: string | null = null
  let brandColor   = DEFAULT_BRAND
  let settings: WorkspaceSettings = {}

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('name, logo_url, brand_color, settings')
        .eq('status', 'ativa')
        .limit(1)
        .single()

      if (workspace) {
        workspaceName  = workspace.name
        logoUrl     = workspace.logo_url ?? null
        brandColor  = workspace.brand_color ?? DEFAULT_BRAND
        settings    = (workspace.settings as WorkspaceSettings) ?? {}
      }
    } catch {
      // Sem DB ainda — usa defaults
    }
  }

  const vars         = brandVars({ brand_color: brandColor, settings })
  const loginImage   = settings.login_image_url ?? null
  const welcomeText  = settings.welcome_text ?? `Bem-vindo à ${workspaceName}`
  const tagline      = settings.tagline ?? 'O cérebro da sua agência'

  return (
    <div className="grid min-h-screen lg:grid-cols-[55%_45%]" style={vars}>
      {/* ── Painel de marca (esquerda) ─────────────────────────────── */}
      <aside className="ginga-grain relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-14">
        {/* Imagem de fundo */}
        {loginImage ? (
          <Image
            src={loginImage}
            alt={workspaceName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <>
            <div className="ginga-glow absolute inset-0 opacity-90" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand/15 blur-[120px]" />
          </>
        )}

        {/* Overlay escuro suave sobre a imagem */}
        {loginImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/20" />
        )}

        {/* Radial highlights (sem imagem) */}
        {!loginImage && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(40% 40% at 80% 10%, rgba(255,255,255,0.5), transparent), radial-gradient(30% 30% at 10% 90%, rgba(255,255,255,0.35), transparent)',
            }}
          />
        )}

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <LogoMark
            name={workspaceName}
            logoUrl={logoUrl ?? undefined}
            className="size-11 bg-white/15 backdrop-blur shadow-none"
          />
          <span className="font-heading text-lg font-semibold tracking-tight text-white drop-shadow">
            {workspaceName}
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-lg">
          <p className="font-heading text-[2.25rem] font-semibold leading-tight tracking-tight text-white drop-shadow-lg">
            {welcomeText}
          </p>
          <p className="mt-4 text-base text-white/75 leading-relaxed">
            {tagline}
          </p>

          {/* Destaques */}
          <div className="mt-8 flex flex-wrap gap-3">
            {['Comercial + Projetos', 'Aprovações do cliente', 'Atlas IA de operações'].map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
              >
                <span className="size-1.5 rounded-full bg-white/80" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <p className="relative z-10 text-xs text-white/50">
          {settings.footer_text ?? 'Desenvolvido por GRP Tecnologia'}
        </p>
      </aside>

      {/* ── Formulário (direita) ────────────────────────────────────── */}
      <main className="flex flex-col items-center justify-center bg-background px-6 py-12 lg:px-14">
        {/* Logo mobile */}
        <div className="mb-10 flex flex-col items-center gap-3 lg:hidden">
          <LogoMark name={workspaceName} logoUrl={logoUrl ?? undefined} className="size-12" />
          <span className="font-heading text-base font-semibold text-foreground">{workspaceName}</span>
        </div>

        <div className="w-full max-w-[360px]">
          {children}
        </div>

        <div className="mt-12">
          <GrpCredit />
        </div>
      </main>
    </div>
  )
}

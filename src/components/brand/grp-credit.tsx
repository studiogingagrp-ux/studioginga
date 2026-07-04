import { cn } from '@/lib/utils'

/**
 * Selo discreto "Desenvolvido por GRP Tecnologia".
 * Vai no rodapé de TODOS os portais (login, dashboard, painel super admin,
 * portal do membro, portal do cliente).
 */
export function GrpCredit({
  className,
  variant = 'light',
}: {
  className?: string
  /** light = fundos claros · dark = fundos escuros */
  variant?: 'light' | 'dark'
}) {
  return (
    <p
      className={cn(
        'text-center text-[11px] tracking-wide select-none',
        variant === 'light' ? 'text-muted-foreground/70' : 'text-white/50',
        className,
      )}
    >
      Desenvolvido por{' '}
      <span className="font-semibold text-brand">GRP Tecnologia</span>
    </p>
  )
}

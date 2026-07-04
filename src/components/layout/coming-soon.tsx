import { Sparkles, type LucideIcon } from 'lucide-react'

export function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
  phase,
}: {
  title: string
  description: string
  icon?: LucideIcon
  phase?: string
}) {
  return (
    <div className="animate-rise mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-accent text-brand shadow-soft">
        <Icon className="size-7" />
      </span>
      <h2 className="mt-6 font-heading text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {phase && (
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3.5 text-brand" /> {phase}
        </span>
      )}
    </div>
  )
}

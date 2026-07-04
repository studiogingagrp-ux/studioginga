'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  name?: string      // nome da agência (white-label)
  logoUrl?: string   // logo_url vindo do banco (opcional)
  tagline?: string
  className?: string
  subtitle?: boolean
}

/**
 * Marca do Ginga Studio — wordmark editorial premium.
 * Usa a logo real da agência (public/ginga-logo.png) assim que existir;
 * enquanto isso, cai no símbolo ouro (ginga-mark.svg). Nunca quebra.
 */
export function Logo({ name, logoUrl, tagline, className, subtitle = true }: LogoProps) {
  const isAgency = !!name && name !== 'Ginga Studio' && name !== 'Ginga Studio'
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark logoUrl={logoUrl} name={name} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[17px] font-extrabold tracking-tight text-foreground">
          {isAgency ? name : (<>Ginga<span className="text-brand"> Studio</span></>)}
        </span>
        {subtitle && tagline && (
          <span className="mt-1 kicker text-muted-foreground">
            {tagline}
          </span>
        )}
      </span>
    </div>
  )
}

/** Símbolo — usa a logo real (PNG) com fallback pro ícone ouro. */
export function LogoMark({
  logoUrl,
  name,
  className,
}: {
  logoUrl?: string
  name?: string
  className?: string
}) {
  const [src, setSrc] = useState(logoUrl || '/ginga-logo.png')
  return (
    <span className={cn('relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name ?? 'Ginga Studio'}
        className="h-full w-full object-contain"
        onError={() => { if (src !== '/ginga-mark.svg') setSrc('/ginga-mark.svg') }}
      />
    </span>
  )
}

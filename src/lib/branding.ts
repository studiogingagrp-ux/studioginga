/**
 * Atlas Agenda — White-label branding system.
 * Cada empresa pode ter sua própria identidade visual.
 * As variáveis CSS são injetadas em runtime no elemento raiz.
 */

export const DEFAULT_BRAND = '#b08d4e' // dourado fosco Atlas Agenda Center

export interface WorkspaceSettings {
  tagline?: string
  welcome_text?: string
  brand_secondary?: string
  brand_button?: string
  login_image_url?: string
  sidebar_image_url?: string
  footer_text?: string
  icon_url?: string
  [key: string]: unknown
}

export interface WorkspaceBranding {
  name?: string | null
  logo_url?: string | null
  brand_color?: string | null
  settings?: WorkspaceSettings | null
}

/** Escurece um hex por um fator (0–1) para gerar o tom secundário do gradiente. */
export function darkenHex(hex: string, factor = 0.78): string {
  const m = hex.replace('#', '')
  if (m.length !== 6) return hex
  const num = parseInt(m, 16)
  const r = Math.round(((num >> 16) & 0xff) * factor)
  const g = Math.round(((num >> 8) & 0xff) * factor)
  const b = Math.round((num & 0xff) * factor)
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

function isValidHex(hex: string | undefined | null): hex is string {
  return !!hex && /^#[0-9a-fA-F]{6}$/.test(hex)
}

/**
 * Gera as CSS custom properties de marca a partir do perfil da empresa.
 * Aceita tanto a string de cor antiga quanto o objeto WorkspaceBranding completo.
 */
export function brandVars(workspace?: WorkspaceBranding | string | null): Record<string, string> {
  // Compatibilidade retroativa: aceita string de cor direta
  if (typeof workspace === 'string' || workspace === null || workspace === undefined) {
    const base = isValidHex(workspace as string) ? (workspace as string) : DEFAULT_BRAND
    return {
      '--brand':           base,
      '--brand-button':    base,
      '--brand-secondary': darkenHex(base),
    }
  }

  const base      = isValidHex(workspace.brand_color) ? workspace.brand_color! : DEFAULT_BRAND
  const secondary = isValidHex(workspace.settings?.brand_secondary)
    ? workspace.settings!.brand_secondary!
    : darkenHex(base)
  const button    = isValidHex(workspace.settings?.brand_button)
    ? workspace.settings!.brand_button!
    : base

  return {
    '--brand':           base,
    '--brand-button':    button,
    '--brand-secondary': secondary,
  }
}

import 'server-only'
import { cookies } from 'next/headers'
import { DEMO_ROLE_COOKIE, type Role } from '@/lib/constants/roles'

export interface DemoSession {
  role: Role
  name: string
  /** Id do membro em GINGA_TEAM correspondente ao papel logado. */
  memberId: string
}

/** Persona de cada papel no modo demo (sem banco). */
const PERSONAS: Record<'dono' | 'membro', DemoSession> = {
  dono:   { role: 'dono',   name: 'Estevam',      memberId: 'g1' },
  membro: { role: 'membro', name: 'Regina Salas', memberId: 'g2' },
}

/** Lê o papel escolhido no modo demo (padrão: dono). */
export async function getDemoSession(): Promise<DemoSession> {
  const store = await cookies()
  const raw = store.get(DEMO_ROLE_COOKIE)?.value
  return raw === 'membro' ? PERSONAS.membro : PERSONAS.dono
}

import type { Metadata } from 'next'
import { ComercialBoard, type LeadRow, type MemberOpt } from '@/components/comercial/comercial-board'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import type { LeadStage } from '@/types/database'

export const metadata: Metadata = { title: 'Comercial' }
export const dynamic = 'force-dynamic'

const COLORS = ['#f2b23e', '#f0722a', '#38bdf8', '#a78bfa', '#34d399', '#fb7185']

function daysSince(iso: string | null): number {
  if (!iso) return 0
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return 0
  return Math.max(0, Math.floor((Date.now() - ms) / 86400000))
}

export default async function ComercialPage() {
  let initialLeads: LeadRow[] | null = null
  let members: MemberOpt[] = []
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: lds }, { data: mbs }] = await Promise.all([
          supabase.from('leads').select('id, company, name, value, stage, member_id, source, updated_at').order('created_at', { ascending: false }),
          supabase.from('profiles').select('id, full_name, agenda_color').in('role', ['dono', 'membro']),
        ])
        members = (mbs ?? []).map((m, i) => ({
          id: m.id as string,
          name: (m.full_name as string) ?? '—',
          color: (m.agenda_color as string | null) ?? COLORS[i % COLORS.length],
          initials: getInitials((m.full_name as string) ?? '—'),
        }))
        initialLeads = (lds ?? []).map((l) => ({
          id: l.id as string,
          company: (l.company as string) ?? '—',
          name: (l.name as string) ?? '—',
          value: Number(l.value) || 0,
          stage: (l.stage as LeadStage) ?? 'novo',
          memberId: (l.member_id as string | null) ?? null,
          source: (l.source as string | null) ?? 'Indicação',
          days: daysSince(l.updated_at as string | null),
        }))
        isRealData = true
      }
    } catch {
      // fallback demo
    }
  }

  return <ComercialBoard initialLeads={initialLeads} members={members} isRealData={isRealData} />
}

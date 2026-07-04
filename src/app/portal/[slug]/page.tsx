import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ClientPortal } from '@/components/portal/client-portal'
import {
  GINGA_CLIENTS, GINGA_PROJECTS, GINGA_APPROVALS, GINGA_AGENDA,
} from '@/lib/demo/agency'

export const dynamic = 'force-dynamic'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function resolveClient(slug: string) {
  return GINGA_CLIENTS.find((c) => slugify(c.name) === slug) ?? GINGA_CLIENTS[0]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = resolveClient(slug)
  return { title: `${c?.name ?? 'Cliente'} · Portal` }
}

export default async function PortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const client = resolveClient(slug)
  if (!client) notFound()

  const projects = GINGA_PROJECTS.filter((p) => p.clientId === client.id)
  const approvals = GINGA_APPROVALS.filter((a) => a.clientId === client.id)
  const meetings = GINGA_AGENDA.filter((m) => m.clientId === client.id)

  return (
    <ClientPortal
      client={client}
      projects={projects}
      approvals={approvals}
      meetings={meetings}
      agency="Ginga Studio"
    />
  )
}

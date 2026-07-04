import type { Metadata } from 'next'
import { WorkspacesTable } from '@/components/admin/workspaces-table'

export const metadata: Metadata = { title: 'Empresas · Super Admin' }
export const dynamic = 'force-dynamic'

export default function AdminWorkspaceasPage() {
  return <WorkspacesTable />
}

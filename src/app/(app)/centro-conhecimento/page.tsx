import type { Metadata } from 'next'
import { KnowledgeCenter } from '@/components/centro-conhecimento/knowledge-center'

export const metadata: Metadata = { title: 'Centro de Conhecimento' }

export default function CentroConhecimentoPage() {
  return <KnowledgeCenter />
}

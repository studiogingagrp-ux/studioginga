import type { Metadata } from 'next'
import { GingaContent } from '@/components/conteudo/ginga-content'

export const metadata: Metadata = { title: 'Conteúdo' }
export const dynamic = 'force-dynamic'

export default function ConteudoPage() {
  return <GingaContent />
}

import type { Metadata } from 'next'
import { WhatsappConnect } from '@/components/whatsapp/whatsapp-connect'

export const metadata: Metadata = { title: 'WhatsApp' }
export const dynamic = 'force-dynamic'

export default function WhatsappPage() {
  return <WhatsappConnect />
}

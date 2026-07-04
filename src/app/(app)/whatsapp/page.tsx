import type { Metadata } from 'next'
import { WhatsappCentral } from '@/components/whatsapp/whatsapp-central'

export const metadata: Metadata = { title: 'WhatsApp' }

export default function WhatsappPage() {
  return <WhatsappCentral />
}

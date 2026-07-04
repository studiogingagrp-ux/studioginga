import type { Metadata } from 'next'
import { CreditCard, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Planos · Super Admin' }
export const dynamic = 'force-dynamic'

const PLANS = [
  { name: 'Essencial', price: 'R$ 197', highlight: false, features: ['Agenda inteligente', 'Cadastro de clientes', 'WhatsApp manual', 'Até 3 usuários'] },
  { name: 'Membro', price: 'R$ 397', highlight: true, features: ['Tudo do Essencial', 'Automações de WhatsApp', 'Portal do Membro', 'Relatórios', 'Até 8 usuários'] },
  { name: 'Premium', price: 'R$ 597', highlight: false, features: ['Tudo do Membro', 'Portal do Cliente', 'White-label completo', 'Lista de espera automática', 'Usuários ilimitados'] },
]

export default function AdminPlanosPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="size-5 text-brand" />
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Planos da plataforma</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className={cn('rounded-2xl border bg-card p-6 shadow-soft', p.highlight ? 'border-brand ring-1 ring-brand/30' : 'border-border')}>
            {p.highlight && <span className="mb-3 inline-block rounded-full bg-brand-gradient px-2.5 py-0.5 text-[11px] font-semibold text-brand-foreground">Mais popular</span>}
            <h2 className="font-heading text-lg font-semibold text-foreground">{p.name}</h2>
            <p className="mt-1 font-heading text-3xl font-semibold text-foreground">{p.price}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            <ul className="mt-5 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="size-4 text-brand" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

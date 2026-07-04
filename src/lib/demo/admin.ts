export interface DemoWorkspace {
  id: string
  name: string
  city: string
  plan: 'Trial' | 'Essencial' | 'Membro' | 'Premium'
  status: 'Ativa' | 'Suspensa'
  users: number
  mrr: number
  color: string
}

export const DEMO_CLINICS: DemoWorkspace[] = [
  { id: 'cl1', name: 'Atlas Agenda Center', city: 'São Paulo/SP', plan: 'Premium',      status: 'Ativa',    users: 8,  mrr: 597, color: '#b08d4e' },
  { id: 'cl2', name: 'Empresa Vitalle',            city: 'Campinas/SP',  plan: 'Membro', status: 'Ativa',    users: 5,  mrr: 397, color: '#3b82f6' },
  { id: 'cl3', name: 'Derma Center',               city: 'Rio de Janeiro/RJ', plan: 'Essencial', status: 'Ativa', users: 3,  mrr: 197, color: '#10b981' },
  { id: 'cl4', name: 'Estética Bella',             city: 'Belo Horizonte/MG', plan: 'Membro', status: 'Ativa', users: 6, mrr: 397, color: '#8b5cf6' },
  { id: 'cl5', name: 'Empresa Renova',             city: 'Curitiba/PR',  plan: 'Trial',        status: 'Ativa',    users: 2,  mrr: 0,   color: '#f59e0b' },
  { id: 'cl6', name: 'Saúde & Pele',               city: 'Porto Alegre/RS', plan: 'Essencial', status: 'Suspensa', users: 3, mrr: 197, color: '#ef4444' },
]

export const PLATFORM_KPIS = {
  workspaces: DEMO_CLINICS.length,
  activeWorkspaces: DEMO_CLINICS.filter((c) => c.status === 'Ativa').length,
  mrr: DEMO_CLINICS.reduce((s, c) => s + c.mrr, 0),
  users: DEMO_CLINICS.reduce((s, c) => s + c.users, 0),
}

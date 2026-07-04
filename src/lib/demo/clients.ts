export interface DemoClient {
  id: string
  name: string
  phone: string
  company: string
  email?: string
  /** Data do último evento/contato com o cliente. */
  lastVisit: string
  notes?: string
}

export const DEMO_CLIENTS: DemoClient[] = [
  { id: 'c1', name: 'Dra. Sofía Herrera',  phone: '5215512345678', company: 'Clínica Vida Bella', email: 'sofia@vidabella.mx',    lastVisit: '30/06/2026' },
  { id: 'c2', name: 'Ricardo Andrade',     phone: '5215598765432', company: 'Grupo Andrade',      email: 'ricardo@andrade.mx',    lastVisit: '28/06/2026' },
  { id: 'c3', name: 'Camila Torres',       phone: '5215577778888', company: 'Café Central',       email: 'camila@cafecentral.mx', lastVisit: '26/06/2026' },
  { id: 'c4', name: 'Miguel Sánchez',      phone: '5215544445555', company: 'Autos del Valle',    email: 'miguel@autosvalle.mx',  lastVisit: '20/06/2026' },
  { id: 'c5', name: 'Fernanda Ríos',       phone: '5215533332222', company: 'Bella Flor Eventos', email: 'fer@bellaflor.mx',      lastVisit: '12/06/2026' },
  { id: 'c6', name: 'Jorge Luna',          phone: '5215566667777', company: 'Luna Fitness',       email: 'jorge@lunafit.mx',      lastVisit: '05/06/2026' },
]

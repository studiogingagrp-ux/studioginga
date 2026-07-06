'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Check, Circle, CalendarClock,
  Calculator as CalcIcon, Wallet, TrendingUp, TrendingDown, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GINGA_FINANCE, clientOf, mx, demoDate, demoToday } from '@/lib/demo/agency'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

type Kind = 'receber' | 'pagar'
interface Entry { id: string; kind: Kind; description: string; amount: number; due: string; paid: boolean; contato?: string }

const uid = () => Math.random().toString(36).slice(2, 9)

// Seed: recebíveis vêm dos contratos + alguns pagáveis de exemplo da agência
const SEED: Entry[] = [
  ...GINGA_FINANCE.map((f) => ({
    id: f.id, kind: 'receber' as Kind, description: f.description,
    amount: f.amount, due: f.due, paid: f.status === 'pago', contato: clientOf(f.clientId)?.name,
  })),
  { id: 'pg1', kind: 'pagar', description: 'Aluguel do estúdio',        amount: 14000, due: demoDate(3),  paid: false, contato: 'Imobiliária' },
  { id: 'pg2', kind: 'pagar', description: 'Ferramentas (Adobe, Meta)', amount: 3200,  due: demoDate(6),  paid: false, contato: 'Software' },
  { id: 'pg3', kind: 'pagar', description: 'Freelancer de motion',      amount: 6500,  due: demoDate(-1), paid: false, contato: 'Bruno F.' },
  { id: 'pg4', kind: 'pagar', description: 'Salários da equipe',        amount: 48000, due: demoDate(4),  paid: false, contato: 'Equipe' },
  { id: 'pg5', kind: 'pagar', description: 'Impostos do mês',           amount: 9800,  due: demoDate(9),  paid: false, contato: 'Contador' },
  { id: 'pg6', kind: 'pagar', description: 'Internet + telefonia',      amount: 1500,  due: demoDate(-3), paid: true,  contato: 'Telecom' },
]

const fmtDia = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
const isLate = (due: string, paid: boolean) => !paid && due < demoToday()

export function FinanceiroView() {
  const [entries, setEntries] = useState<Entry[]>(SEED)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ kind: Kind; description: string; amount: string; due: string; contato: string }>({
    kind: 'pagar', description: '', amount: '', due: demoToday(), contato: '',
  })

  const receber = entries.filter((e) => e.kind === 'receber')
  const pagar = entries.filter((e) => e.kind === 'pagar')

  const aReceber = receber.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0)
  const aPagar = pagar.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0)
  const recebido = receber.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0)
  const pago = pagar.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0)
  const saldoPrevisto = aReceber - aPagar

  const vencimentos = useMemo(
    () => entries.filter((e) => !e.paid).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8),
    [entries],
  )

  function togglePaid(id: string) {
    setEntries((es) => es.map((e) => e.id === id ? { ...e, paid: !e.paid } : e))
  }
  function remove(id: string) {
    setEntries((es) => es.filter((e) => e.id !== id))
  }
  function add() {
    const amount = Number(String(form.amount).replace(',', '.'))
    if (!form.description.trim() || !amount) { toast.error('Informe descrição e valor'); return }
    setEntries((es) => [...es, { id: uid(), kind: form.kind, description: form.description.trim(), amount, due: form.due, paid: false, contato: form.contato.trim() || undefined }])
    toast.success(form.kind === 'receber' ? 'Conta a receber adicionada 💚' : 'Conta a pagar adicionada')
    setForm({ kind: form.kind, description: '', amount: '', due: demoToday(), contato: '' })
    setOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Financeiro</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Finanças da agência</h1>
          <p className="mt-1 text-sm text-muted-foreground">Contas a pagar, a receber e o saldo do mês — simples e no controle.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
          <Plus className="size-4" /> Novo lançamento
        </button>
      </header>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={TrendingUp} label="A receber" value={mx(aReceber)} tone="text-emerald-300" />
        <Kpi icon={TrendingDown} label="A pagar" value={mx(aPagar)} tone="text-rose-300" />
        <Kpi icon={Wallet} label="Saldo previsto" value={mx(saldoPrevisto)} tone={saldoPrevisto >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
        <Kpi icon={Check} label="No mês (receb. − pago)" value={mx(recebido - pago)} tone="text-foreground" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Listas */}
        <div className="space-y-6 lg:col-span-2">
          <ContasList title="Contas a receber" icon={ArrowDownCircle} accent="text-emerald-300" itens={receber} onToggle={togglePaid} onRemove={remove} />
          <ContasList title="Contas a pagar" icon={ArrowUpCircle} accent="text-rose-300" itens={pagar} onToggle={togglePaid} onRemove={remove} />
        </div>

        {/* Vencimentos + Calculadora */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <CalendarClock className="size-4 text-brand" />
              <h2 className="font-display text-sm font-bold text-foreground">Próximos vencimentos</h2>
            </div>
            <div className="space-y-1.5">
              {vencimentos.map((e) => {
                const late = isLate(e.due, e.paid)
                return (
                  <div key={e.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                    <span className={cn('w-12 shrink-0 font-mono text-xs font-semibold tabular', late ? 'text-rose-300' : 'text-brand')}>{fmtDia(e.due)}</span>
                    <span className={cn('size-1.5 shrink-0 rounded-full', e.kind === 'receber' ? 'bg-emerald-400' : 'bg-rose-400')} />
                    <span className="min-w-0 flex-1 truncate text-xs text-foreground">{e.description}</span>
                    <span className={cn('shrink-0 text-xs font-medium tabular', e.kind === 'receber' ? 'text-emerald-300' : 'text-rose-300')}>
                      {e.kind === 'receber' ? '+' : '−'}{mx(e.amount).replace('MX$ ', '')}
                    </span>
                  </div>
                )
              })}
              {vencimentos.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted-foreground">Nada pendente. 🎉</p>}
            </div>
            <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-muted-foreground/70">
              Sua agenda financeira — de olho nos prazos pra nunca perder um pagamento ou recebimento.
            </p>
          </section>

          <Calculadora />
        </div>
      </div>

      {/* Novo lançamento */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Novo lançamento</SheetTitle>
            <SheetDescription>Adicione uma conta a pagar ou a receber.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="grid grid-cols-2 gap-2">
              {(['receber', 'pagar'] as Kind[]).map((k) => (
                <button key={k} onClick={() => setForm({ ...form, kind: k })}
                  className={cn('rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                    form.kind === k
                      ? k === 'receber' ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300' : 'border-rose-400 bg-rose-500/10 text-rose-300'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
                  {k === 'receber' ? 'A receber' : 'A pagar'}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Descrição</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Aluguel, Contrato Cliente X…" className={inp} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Valor (MX$)</span>
                <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" placeholder="0,00" className={inp} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Vencimento</span>
                <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className={inp} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente / fornecedor (opcional)</span>
              <input value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} placeholder="Nome" className={inp} />
            </label>
            <button onClick={add} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95">
              <Plus className="size-4" /> Adicionar
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const inp = 'h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground/60"><Icon className={cn('size-4', tone)} /><span className="kicker">{label}</span></div>
      <p className={cn('mt-2 font-display text-xl font-extrabold tabular', tone)}>{value}</p>
    </div>
  )
}

function ContasList({ title, icon: Icon, accent, itens, onToggle, onRemove }: {
  title: string; icon: typeof ArrowUpCircle; accent: string; itens: Entry[]
  onToggle: (id: string) => void; onRemove: (id: string) => void
}) {
  const pend = itens.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0)
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Icon className={cn('size-4', accent)} />
          <h2 className="font-display text-sm font-bold text-foreground">{title}</h2>
        </div>
        <span className={cn('font-display text-sm font-bold tabular', accent)}>{mx(pend)}</span>
      </div>
      <ul className="divide-y divide-border">
        {itens.map((e) => {
          const late = isLate(e.due, e.paid)
          return (
            <li key={e.id} className={cn('group flex items-center gap-3 px-5 py-3', e.paid && 'opacity-55')}>
              <button onClick={() => onToggle(e.id)} className="shrink-0" title={e.paid ? 'Marcar como pendente' : 'Marcar como pago'}>
                {e.paid ? <Check className="size-4 text-emerald-400" /> : <Circle className="size-4 text-muted-foreground/40 hover:text-brand" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-medium', e.paid ? 'text-muted-foreground line-through' : 'text-foreground')}>{e.description}</p>
                <p className="truncate text-xs text-muted-foreground">{e.contato ? `${e.contato} · ` : ''}vence {fmtDia(e.due)}{late && <span className="text-rose-300"> · atrasado</span>}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground tabular">{mx(e.amount)}</span>
              <button onClick={() => onRemove(e.id)} className="shrink-0 text-muted-foreground/30 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100" title="Remover">
                <Trash2 className="size-4" />
              </button>
            </li>
          )
        })}
        {itens.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted-foreground">Nenhum lançamento.</li>}
      </ul>
    </section>
  )
}

// ── Calculadora simples ──────────────────────────────────────
function Calculadora() {
  const [display, setDisplay] = useState('0')
  const [acc, setAcc] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [fresh, setFresh] = useState(true)

  const compute = (a: number, b: number, o: string) =>
    o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b === 0 ? NaN : a / b) : b

  function digit(d: string) {
    if (fresh) { setDisplay(d === '.' ? '0.' : d); setFresh(false); return }
    if (d === '.' && display.includes('.')) return
    setDisplay(display === '0' && d !== '.' ? d : display + d)
  }
  function operator(o: string) {
    const cur = parseFloat(display)
    if (acc !== null && op && !fresh) {
      const r = compute(acc, cur, op)
      setAcc(r); setDisplay(String(+r.toFixed(6)))
    } else setAcc(cur)
    setOp(o); setFresh(true)
  }
  function equals() {
    if (acc === null || !op) return
    const r = compute(acc, parseFloat(display), op)
    setDisplay(isNaN(r) ? 'Erro' : String(+r.toFixed(6)))
    setAcc(null); setOp(null); setFresh(true)
  }
  function clear() { setDisplay('0'); setAcc(null); setOp(null); setFresh(true) }

  const keys = ['C', '÷', '×', '⌫', '7', '8', '9', '−', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.']
  function press(k: string) {
    if (k === 'C') return clear()
    if (k === '⌫') return setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'))
    if (k === '=') return equals()
    if (['+', '−', '×', '÷'].includes(k)) return operator(k)
    return digit(k)
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <CalcIcon className="size-4 text-brand" />
        <h2 className="font-display text-sm font-bold text-foreground">Calculadora</h2>
      </div>
      <div className="mb-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-right font-mono text-2xl font-bold text-foreground tabular overflow-x-auto">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {keys.map((k) => {
          const isOp = ['÷', '×', '−', '+', '='].includes(k)
          const isFn = ['C', '⌫'].includes(k)
          return (
            <button key={k} onClick={() => press(k)}
              className={cn('h-11 rounded-lg text-sm font-semibold transition-colors',
                k === '=' ? 'row-span-1 bg-brand-gradient text-brand-foreground shadow-gold' :
                isOp ? 'bg-brand/10 text-brand hover:bg-brand/20' :
                isFn ? 'bg-secondary text-muted-foreground hover:text-foreground' :
                'bg-secondary/60 text-foreground hover:bg-secondary',
                k === '0' && 'col-span-2')}>
              {k}
            </button>
          )
        })}
      </div>
    </section>
  )
}

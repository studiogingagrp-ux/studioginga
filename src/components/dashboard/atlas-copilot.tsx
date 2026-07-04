'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sparkles, X, BadgeCheck, CalendarDays, ArrowRight, Sun } from 'lucide-react'

interface Stats { reunioes: number; aprovacoes: number; atrasadas: number; semContato: number }

const todayKey = () => `ginga_copilot_${new Date().toISOString().split('T')[0]}`

export function AtlasCopilot({ name, stats }: { name: string; stats: Stats }) {
  const first = name.split(' ')[0]
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const hour = new Date().getHours()
  const saud = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const full =
    `${saud}, ${first}. Já passei os olhos na agência pra você. ☕\n\n` +
    `Hoje temos ${stats.reunioes} compromissos na agenda e ${stats.aprovacoes} aprovações esperando resposta. ` +
    (stats.atrasadas > 0
      ? `Reparei em ${stats.atrasadas} tarefa${stats.atrasadas > 1 ? 's' : ''} atrasada${stats.atrasadas > 1 ? 's' : ''} — sugiro começar por elas.`
      : `Nenhuma tarefa atrasada — a operação tá voando! 🔥`) +
    (stats.semContato > 0
      ? `\n\nE ${stats.semContato} cliente${stats.semContato > 1 ? 's estão' : ' está'} sem contato faz um tempo. Um alô reativa a relação.`
      : '') +
    `\n\nBora fazer um dia redondo? 🌀`

  // abre 1x por dia
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(todayKey())) {
      const t = setTimeout(() => setOpen(true), 450)
      return () => clearTimeout(t)
    }
  }, [])

  // efeito máquina de escrever
  useEffect(() => {
    if (!open) return
    setTyped(''); setDone(false)
    let i = 0
    timer.current = setInterval(() => {
      i += 2
      setTyped(full.slice(0, i))
      if (i >= full.length) { if (timer.current) clearInterval(timer.current); setTyped(full); setDone(true) }
    }, 16)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [open, full])

  function fechar() {
    if (typeof window !== 'undefined') localStorage.setItem(todayKey(), '1')
    setOpen(false)
  }
  function skip() {
    if (timer.current) clearInterval(timer.current)
    setTyped(full); setDone(true)
  }

  return (
    <>
      {/* Botão flutuante — reabrir o Atlas */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-brand-gradient shadow-gold transition-transform hover:scale-105 active:scale-95 animate-pulse-gold"
        aria-label="Abrir Atlas Copilot"
        title="Falar com o Atlas"
      >
        <Sparkles className="size-6 text-brand-foreground" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={fechar} />
          <div className="animate-rise relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-brand/30 bg-card shadow-card" onClick={skip}>
            <div aria-hidden className="ginga-glow pointer-events-none absolute inset-0 opacity-60" />
            <button onClick={fechar} className="absolute right-4 top-4 z-20 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Fechar">
              <X className="size-4" />
            </button>

            <div className="relative p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient shadow-gold animate-pulse-gold">
                  <Sparkles className="size-6 text-brand-foreground" />
                </div>
                <div>
                  <p className="font-display text-lg font-extrabold tracking-tight text-foreground">Atlas</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="relative flex size-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" /></span>
                    seu copiloto da agência
                  </p>
                </div>
              </div>

              <p className="mt-5 min-h-[7rem] whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                {typed}
                {!done && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-brand" />}
              </p>

              {/* Ações — aparecem ao terminar de digitar */}
              <div className={`mt-5 flex flex-wrap gap-2 transition-all duration-500 ${done ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'}`}>
                {stats.aprovacoes > 0 && (
                  <Link href="/aprovacoes" onClick={fechar} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
                    <BadgeCheck className="size-3.5" /> Resolver aprovações
                  </Link>
                )}
                <Link href="/agenda" onClick={fechar} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
                  <CalendarDays className="size-3.5 text-brand" /> Ver agenda
                </Link>
                <Link href="/atlas" onClick={fechar} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary">
                  <Sparkles className="size-3.5 text-brand" /> Falar com o Atlas
                </Link>
                <button onClick={fechar} className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10">
                  <Sun className="size-3.5" /> Começar o dia <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { MessageCircle, Loader2, CheckCircle2, RefreshCw, Smartphone, ShieldCheck, LogOut, AlertCircle, Wifi, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type State = 'loading' | 'not_configured' | 'connecting' | 'open' | 'error'

export function WhatsappConnect() {
  const [state, setState] = useState<State>('loading')
  const [qr, setQr] = useState<string | null>(null)
  const [pairing, setPairing] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status', { cache: 'no-store' })
      const data = await res.json()
      if (!data.configured) { setState('not_configured'); return 'not_configured' }
      if (data.state === 'open') { setState('open'); setQr(null); return 'open' }
      return 'other'
    } catch {
      return 'other'
    }
  }, [])

  const loadQr = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/connect', { cache: 'no-store' })
      const data = await res.json()
      if (!data.configured) { setState('not_configured'); return }
      if (data.state === 'open') { setState('open'); setQr(null); return }
      if (data.state === 'error') { setState('error'); setErrMsg(data.error ?? null); return }
      setQr(data.base64 ?? null)
      setPairing(data.pairingCode ?? null)
      setState('connecting')
    } catch (e) {
      setState('error'); setErrMsg(e instanceof Error ? e.message : 'Erro')
    }
  }, [])

  // Boot: status → se não conectado, gera QR
  useEffect(() => {
    (async () => {
      const s = await fetchStatus()
      if (s === 'not_configured' || s === 'open') return
      await loadQr()
    })()
  }, [fetchStatus, loadQr])

  // Polling enquanto está pareando: a cada 5s checa se conectou; renova QR a cada 25s
  useEffect(() => {
    if (state !== 'connecting') { if (pollRef.current) clearInterval(pollRef.current); return }
    let ticks = 0
    pollRef.current = setInterval(async () => {
      ticks++
      const s = await fetchStatus()
      if (s === 'open') { toast.success('WhatsApp conectado! 🎉'); return }
      if (ticks % 5 === 0) await loadQr() // renova o QR a cada ~25s (expira)
    }, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [state, fetchStatus, loadQr])

  async function regenerar() {
    setBusy(true); setQr(null)
    await loadQr()
    setBusy(false)
  }

  async function desconectar() {
    if (!confirm('Desconectar o WhatsApp da agência? Você precisará escanear o QR de novo.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      const data = await res.json()
      if (data.ok) { toast.success('WhatsApp desconectado.'); setState('connecting'); await loadQr() }
      else toast.error(data.error ?? 'Não foi possível desconectar.')
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Integrações</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">WhatsApp</h1>
          <p className="mt-1 text-sm text-muted-foreground">Conecte o número da agência para o Atlas enviar confirmações e lembretes.</p>
        </div>
        <StatusBadge state={state} />
      </header>

      {state === 'not_configured' && (
        <Card>
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-300"><AlertCircle className="size-5" /></span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-foreground">Servidor de WhatsApp ainda não ligado</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                A tela de conexão está pronta. Falta ligar o servidor de mensagens (Evolution API) da GRP a esta agência —
                é um passo técnico rápido do nosso lado. Assim que ligarmos, o QR code aparece aqui e é só escanear.
              </p>
            </div>
          </div>
        </Card>
      )}

      {state === 'loading' && (
        <Card><div className="flex items-center justify-center gap-3 py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Verificando conexão…</div></Card>
      )}

      {state === 'error' && (
        <Card>
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-500/15 text-rose-300"><AlertCircle className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground">Não foi possível gerar o QR agora</h2>
              <p className="mt-1 text-sm text-muted-foreground">{errMsg || 'Tente novamente em instantes.'}</p>
              <button onClick={regenerar} disabled={busy} className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 text-sm font-medium text-foreground hover:bg-white/10 disabled:opacity-60">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Tentar de novo
              </button>
            </div>
          </div>
        </Card>
      )}

      {state === 'open' && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:text-left">
            <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-emerald-500/15 text-emerald-300"><CheckCircle2 className="size-8" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-extrabold text-foreground">WhatsApp conectado 🎉</h2>
              <p className="mt-1 text-sm text-muted-foreground">O Atlas já pode enviar mensagens pelo número da agência. Mantenha o celular com internet.</p>
            </div>
            <button onClick={desconectar} disabled={busy} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-60">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} Desconectar
            </button>
          </div>
        </Card>
      )}

      {state === 'connecting' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* QR */}
          <Card>
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative grid size-64 place-items-center overflow-hidden rounded-2xl border border-border bg-white p-3">
                {qr
                  ? <Image src={qr} alt="QR code do WhatsApp" width={240} height={240} className="size-full object-contain" unoptimized />
                  : <div className="flex flex-col items-center gap-2 text-muted-foreground"><Loader2 className="size-6 animate-spin" /><span className="text-xs">Gerando QR…</span></div>}
              </div>
              {pairing && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Ou digite o código no WhatsApp:</p>
                  <p className="mt-1 font-mono text-lg font-bold tracking-widest text-foreground">{pairing}</p>
                </div>
              )}
              <button onClick={regenerar} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-60">
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Gerar novo QR
              </button>
            </div>
          </Card>

          {/* Passo a passo */}
          <Card>
            <h2 className="font-display text-base font-bold text-foreground">Como conectar</h2>
            <ol className="mt-4 space-y-4">
              <Step n={1} icon={Smartphone}>Abra o <b className="text-foreground">WhatsApp</b> no celular da agência.</Step>
              <Step n={2} icon={MoreVertical}>Toque em <b className="text-foreground">Config. → Aparelhos conectados</b>.</Step>
              <Step n={3} icon={Wifi}>Toque em <b className="text-foreground">Conectar um aparelho</b>.</Step>
              <Step n={4} icon={MessageCircle}>Aponte a câmera para o <b className="text-foreground">QR code</b> ao lado.</Step>
            </ol>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3.5 py-2.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-brand" />
              A conexão fica ativa e reconecta sozinha. Esta tela avisa quando parear.
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ state }: { state: State }) {
  const map = {
    open:           { label: 'Conectado', cls: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300', dot: 'bg-emerald-400' },
    connecting:     { label: 'Aguardando leitura', cls: 'border-amber-500/25 bg-amber-500/10 text-amber-300', dot: 'bg-amber-400 animate-pulse' },
    loading:        { label: 'Verificando…', cls: 'border-border bg-card text-muted-foreground', dot: 'bg-muted-foreground' },
    not_configured: { label: 'Não ligado', cls: 'border-border bg-card text-muted-foreground', dot: 'bg-muted-foreground' },
    error:          { label: 'Erro', cls: 'border-rose-500/25 bg-rose-500/10 text-rose-300', dot: 'bg-rose-400' },
  }[state]
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium', map.cls)}>
      <span className={cn('size-1.5 rounded-full', map.dot)} /> {map.label}
    </span>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">{children}</div>
}
function Step({ n, icon: Icon, children }: { n: number; icon: typeof Smartphone; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 font-display text-xs font-bold text-brand">{n}</span>
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{children}</p>
    </li>
  )
}

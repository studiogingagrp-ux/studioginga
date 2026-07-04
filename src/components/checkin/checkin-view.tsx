'use client'

import { useState } from 'react'
import { MapPin, Camera, Clock, LocateFixed, Loader2, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'
import { GINGA_CLIENTS, GINGA_TEAM, clientOf, memberOf } from '@/lib/demo/agency'

interface Visit {
  id: string; clientId: string; memberId: string; at: string
  lat: number; lng: number; note: string; photo?: string; real: boolean
}

const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
// centro aproximado da CDMX (fallback quando o GPS é negado)
const MX_FALLBACK = { lat: 19.4326, lng: -99.1332 }

const SEED: Visit[] = [
  { id: 'v1', clientId: 'c1', memberId: 'g5', at: '10:12', lat: 19.4270, lng: -99.1676, note: 'Gravação no showroom.', real: false },
  { id: 'v2', clientId: 'c4', memberId: 'g6', at: '09:03', lat: 19.3900, lng: -99.2837, note: 'Reunião de briefing no stand.', real: false },
]

const sel = 'h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'
const inp = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'

export function CheckinView() {
  const [visits, setVisits] = useState<Visit[]>(SEED)
  const [clientId, setClientId] = useState('c1')
  const [memberId, setMemberId] = useState('g1')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  function registrar() {
    setLoading(true)
    const finish = (lat: number, lng: number, real: boolean) => {
      setVisits((prev) => [{ id: Math.random().toString(36).slice(2), clientId, memberId, at: now(), lat, lng, note: note.trim(), photo, real }, ...prev])
      setNote(''); setPhoto(undefined); setLoading(false)
      toast.success('📍 Check-in registrado!')
    }
    if (!navigator.geolocation) { finish(MX_FALLBACK.lat, MX_FALLBACK.lng, false); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => finish(pos.coords.latitude, pos.coords.longitude, true),
      () => { finish(MX_FALLBACK.lat, MX_FALLBACK.lng, false); toast.info('GPS indisponível — usei uma localização de demonstração.') },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="kicker text-brand">Campo</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Check-in de visita</h1>
        <p className="mt-1 text-sm text-muted-foreground">O colaborador registra a visita com localização, hora e foto — prova de presença.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Novo check-in */}
        <div className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.06] to-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <LocateFixed className="size-4 text-brand" />
            <h2 className="font-display text-sm font-bold text-foreground">Novo check-in</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente / local</span>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={sel}>
                  {GINGA_CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Colaborador</span>
                <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={sel}>
                  {GINGA_TEAM.map((m) => <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>)}
                </select></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Observação</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: gravação externa, reunião no local…" className={inp} /></label>

            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary">
                <Camera className="size-4 text-brand" /> {photo ? 'Trocar foto' : 'Adicionar foto'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)) }} />
              </label>
              {photo && (
                <span className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="size-11 rounded-lg object-cover" />
                  <button onClick={() => setPhoto(undefined)} className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-rose-500 text-white"><X className="size-2.5" /></button>
                </span>
              )}
            </div>

            <button onClick={registrar} disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60">
              {loading ? <><Loader2 className="size-4 animate-spin" /> Capturando localização…</> : <><MapPin className="size-4" /> Registrar check-in</>}
            </button>
            <p className="text-center text-[11px] text-muted-foreground/60">Usa o GPS do aparelho. Sem GPS, registra uma localização de demonstração.</p>
          </div>
        </div>

        {/* Histórico */}
        <div>
          <p className="kicker mb-2 px-1 text-muted-foreground/50">Check-ins recentes</p>
          <div className="space-y-2.5">
            {visits.map((v) => {
              const c = clientOf(v.clientId); const m = memberOf(v.memberId)
              return (
                <div key={v.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                  {v.photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={v.photo} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                    : <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-brand"><MapPin className="size-5" /></span>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{c?.name}</p>
                      {v.real && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300"><CheckCircle2 className="size-2.5" /> GPS</span>}
                    </div>
                    {v.note && <p className="truncate text-xs text-muted-foreground">{v.note}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground/80">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {v.at}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {v.lat.toFixed(4)}, {v.lng.toFixed(4)}</span>
                      {m && <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full" style={{ backgroundColor: m.color }} /> {m.name.split(' ')[0]}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

import { AGENDA_START_HOUR, AGENDA_END_HOUR, SLOT_MINUTES } from '@/lib/demo/data'

export const TOTAL_SLOTS = ((AGENDA_END_HOUR - AGENDA_START_HOUR) * 60) / SLOT_MINUTES
export const SLOT_HEIGHT = 56 // px por slot de 30min

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Índice do slot (0 = AGENDA_START_HOUR) a partir de 'HH:mm'. */
export function slotIndexFromTime(hhmm: string): number {
  return (timeToMinutes(hhmm) - AGENDA_START_HOUR * 60) / SLOT_MINUTES
}

/** 'HH:mm' a partir do índice do slot. */
export function timeFromSlotIndex(idx: number): string {
  return minutesToTime(AGENDA_START_HOUR * 60 + idx * SLOT_MINUTES)
}

/** Lista de rótulos de hora cheia para a régua lateral. */
export function hourLabels(): { label: string; slot: number }[] {
  const out: { label: string; slot: number }[] = []
  for (let h = AGENDA_START_HOUR; h <= AGENDA_END_HOUR; h++) {
    out.push({ label: `${String(h).padStart(2, '0')}:00`, slot: ((h - AGENDA_START_HOUR) * 60) / SLOT_MINUTES })
  }
  return out
}

export function endTime(start: string, durationMin: number): string {
  return minutesToTime(timeToMinutes(start) + durationMin)
}

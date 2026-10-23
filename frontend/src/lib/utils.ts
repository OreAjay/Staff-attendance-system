import { useEffect, useState } from 'react'
import type { AttendanceRecord, Staff } from './api'

/** Backend stores UTC timestamps without a zone ("2026-10-19 09:52:28"). Parse as UTC. */
export const parseTs = (ts: string) => new Date(ts.replace(' ', 'T') + 'Z')

/** Local-date key, e.g. "2026-10-23" */
export const dayKey = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export const fmtTime = (d: Date | null) =>
  d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export interface DayRow {
  staff: Staff
  timeIn: Date | null
  timeOut: Date | null
  present: boolean
}

/** One row per registered staff member for a given local day. */
export function buildDay(staff: Staff[], records: AttendanceRecord[], key: string): DayRow[] {
  const byStaff = new Map<string, { ins: Date[]; outs: Date[] }>()
  for (const r of records) {
    const d = parseTs(r.timestamp)
    if (dayKey(d) !== key) continue
    const e = byStaff.get(r.staff_id) ?? { ins: [], outs: [] }
    if (r.action === 'clock_in') e.ins.push(d)
    else e.outs.push(d)
    byStaff.set(r.staff_id, e)
  }
  const earliest = (a: Date[]) => (a.length ? new Date(Math.min(...a.map(Number))) : null)
  const latest = (a: Date[]) => (a.length ? new Date(Math.max(...a.map(Number))) : null)

  return staff.map((s) => {
    const e = byStaff.get(s.staff_id)
    const timeIn = e ? earliest(e.ins) : null
    const out = e ? latest(e.outs) : null
    const timeOut = timeIn && out && out > timeIn ? out : null
    return { staff: s, timeIn, timeOut, present: !!timeIn }
  })
}

/** Latest record per staff (highest id wins, same rule the backend uses). */
export function latestActions(records: AttendanceRecord[]) {
  const m = new Map<string, AttendanceRecord>()
  for (const r of records) {
    const cur = m.get(r.staff_id)
    if (!cur || r.id > cur.id) m.set(r.staff_id, r)
  }
  return m
}

/** Last n local days ending today, oldest first. */
export function lastDays(n: number, from = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - (n - 1 - i))
    return d
  })
}

/** Inclusive list of day keys between two keys (max 366). */
export function keysBetween(fromK: string, toK: string) {
  const out: string[] = []
  const d = fromKey(fromK)
  const end = fromKey(toK)
  while (d <= end && out.length < 366) {
    out.push(dayKey(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
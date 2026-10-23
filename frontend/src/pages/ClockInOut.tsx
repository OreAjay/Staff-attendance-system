import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Clock, LogIn, LogOut } from 'lucide-react'
import { api } from '../lib/api'
import { useData } from '../lib/data'
import { buildDay, dayKey, fmtTime, latestActions, parseTs, useNow } from '../lib/utils'
import { Avatar, Card, Empty, inputCls } from '../components/ui'
import { useToast } from '../components/Toast'

export default function ClockInOut() {
  const { staff, records, refresh } = useData()
  const toast = useToast()
  const now = useNow()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  const q = query.trim().toLowerCase()
  const match = useMemo(
    () =>
      q
        ? (staff.find((s) => s.staff_id.toLowerCase() === q) ??
          staff.find((s) => s.full_name.toLowerCase() === q) ??
          null)
        : null,
    [q, staff],
  )
  const suggestions = useMemo(
    () =>
      q && !match
        ? staff
            .filter((s) => s.staff_id.toLowerCase().includes(q) || s.full_name.toLowerCase().includes(q))
            .slice(0, 5)
        : [],
    [q, match, staff],
  )

  const latest = match ? latestActions(records).get(match.staff_id) : undefined
  const clockedIn = latest?.action === 'clock_in'
  const nextAction = clockedIn ? 'clock_out' : 'clock_in'
  const today = match ? buildDay([match], records, dayKey(now))[0] : undefined

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!match || busy) return
    setBusy(true)
    try {
      await api.record(match.staff_id, nextAction)
      toast('success', `${match.full_name} clocked ${nextAction === 'clock_in' ? 'in' : 'out'}`)
      setQuery('')
      await refresh()
      inputRef.current?.focus()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Something went wrong')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const recent = records.slice(0, 7)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Clock In / Out</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <form onSubmit={submit} className="mx-auto max-w-md space-y-5 py-4 text-center">
            <div>
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Staff ID or name, then press Enter"
                className={`${inputCls} py-3 text-center text-base`}
              />
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      type="button"
                      key={s.staff_id}
                      onClick={() => setQuery(s.staff_id)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs hover:border-blue-400"
                    >
                      {s.full_name} · {s.staff_id}
                    </button>
                  ))}
                </div>
              )}
              {q && !match && suggestions.length === 0 && (
                <p className="mt-2 text-xs text-red-500">No staff found with that ID or name.</p>
              )}
            </div>

            <div
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
                match ? (clockedIn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500') : 'bg-slate-100 text-slate-300'
              }`}
            >
              <Clock size={44} />
            </div>

            {match ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Avatar name={match.full_name} size={28} />
                  <span className="font-semibold">{match.full_name}</span>
                  <span className="text-sm text-slate-400">
                    {match.staff_id} · {match.department}
                  </span>
                </div>
                <div className="text-xs text-slate-500">You are currently</div>
                <div className={`text-3xl font-bold ${clockedIn ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {clockedIn ? 'Checked In' : 'Checked Out'}
                </div>
                <div className="text-xs text-slate-400">
                  {latest
                    ? `Last ${latest.action === 'clock_in' ? 'clock in' : 'clock out'}: ${parseTs(latest.timestamp).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'No records yet'}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">Pick a staff member to see their status</div>
            )}

            <button
              type="submit"
              disabled={!match || busy}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                clockedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {clockedIn ? <LogOut size={18} /> : <LogIn size={18} />}
              {busy ? 'Saving...' : clockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Today's Attendance</h3>
            <div className="grid grid-cols-2 divide-x divide-slate-100 text-center">
              <div>
                <div className="text-xs text-slate-500">Time In</div>
                <div className="mt-1 text-lg font-semibold">{fmtTime(today?.timeIn ?? null)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Time Out</div>
                <div className="mt-1 text-lg font-semibold">{fmtTime(today?.timeOut ?? null)}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Recent Activity" className="lg:col-span-2">
          {recent.length === 0 ? (
            <Empty>No activity yet.</Empty>
          ) : (
            <ul className="space-y-4">
              {recent.map((r) => {
                const d = parseTs(r.timestamp)
                const isIn = r.action === 'clock_in'
                return (
                  <li key={r.id} className="flex items-center gap-3">
                    <Avatar name={r.full_name ?? r.staff_id} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{r.full_name ?? r.staff_id}</div>
                      <div className={`text-xs ${isIn ? 'text-emerald-600' : 'text-slate-500'}`}>
                        ● {isIn ? 'Clocked in' : 'Clocked out'} · {fmtTime(d)}
                        {dayKey(d) !== dayKey(now) && ` · ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
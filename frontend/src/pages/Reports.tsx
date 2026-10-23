import { useMemo, useState } from 'react'
import { CalendarDays, Clock, Download, UserX, Users } from 'lucide-react'
import { useData } from '../lib/data'
import { buildDay, dayKey, downloadCsv, fmtTime, fromKey, keysBetween, lastDays } from '../lib/utils'
import { Card, Empty, StatCard, inputCls } from '../components/ui'

export default function Reports() {
  const { staff, records } = useData()
  const week = lastDays(7)
  const [from, setFrom] = useState(dayKey(week[0]!))
  const [to, setTo] = useState(dayKey(week[6]!))

  const keys = useMemo(() => keysBetween(from, to), [from, to])
  const perDay = useMemo(
    () => keys.map((k) => ({ key: k, rows: buildDay(staff, records, k) })),
    [keys, staff, records],
  )

  const total = staff.length
  const days = perDay.length
  const presentSum = perDay.reduce((n, d) => n + d.rows.filter((r) => r.present).length, 0)
  const avgPresent = days ? Math.round(presentSum / days) : 0
  const avgAbsent = total - avgPresent
  const rate = total && days ? Math.round((presentSum / (total * days)) * 100) : 0
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  function generate() {
    const out: (string | number)[][] = [['Date', 'Staff ID', 'Name', 'Department', 'Status', 'Time In', 'Time Out']]
    for (const d of perDay)
      for (const r of d.rows)
        out.push([
          d.key,
          r.staff.staff_id,
          r.staff.full_name,
          r.staff.department,
          r.present ? 'Present' : 'Absent',
          r.timeIn ? fmtTime(r.timeIn) : '',
          r.timeOut ? fmtTime(r.timeOut) : '',
        ])
    downloadCsv(`attendance-report_${from}_to_${to}.csv`, out)
  }

  // donut
  const R = 52
  const C = 2 * Math.PI * R

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className={`${inputCls} w-auto`} />
          <span className="text-sm text-slate-400">to</span>
          <input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} className={`${inputCls} w-auto`} />
          <button
            onClick={generate}
            disabled={!days || !total}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            <Download size={16} /> Generate Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="blue" icon={<Users size={22} />} label="Total Staff" value={total} note="Registered staff" />
        <StatCard tone="green" icon={<Clock size={22} />} label="Present (Avg)" value={avgPresent} note={`${pct(avgPresent)}% per day`} />
        <StatCard tone="red" icon={<UserX size={22} />} label="Absent (Avg)" value={avgAbsent} note={`${pct(avgAbsent)}% per day`} />
        <StatCard tone="violet" icon={<CalendarDays size={22} />} label="Days in Range" value={days} note="Includes weekends" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Attendance Summary" className="lg:col-span-2">
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0 -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" stroke="#fecaca" strokeWidth="14" />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeDasharray={`${(rate / 100) * C} ${C}`}
                strokeLinecap="butt"
              />
              <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center fill-slate-900 text-[22px] font-bold">
                {rate}%
              </text>
            </svg>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Present
                <b className="ml-2 text-slate-900">{presentSum}</b>
              </li>
              <li className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full bg-red-200" /> Absent
                <b className="ml-2 text-slate-900">{total * days - presentSum}</b>
              </li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-slate-400">Staff-days across the selected range.</p>
        </Card>

        <Card title="Daily Attendance" className="lg:col-span-3">
          {perDay.length === 0 ? (
            <Empty>Pick a valid date range.</Empty>
          ) : (
            <div className="max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Present</th>
                    <th className="px-3 py-2 font-medium">Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...perDay].reverse().map((d) => {
                    const p = d.rows.filter((r) => r.present).length
                    return (
                      <tr key={d.key}>
                        <td className="px-3 py-2">
                          {fromKey(d.key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-2 text-emerald-700">{p}</td>
                        <td className="px-3 py-2 text-red-600">{total - p}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
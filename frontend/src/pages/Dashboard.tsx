import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, UserX, Users } from 'lucide-react'
import { useData } from '../lib/data'
import { buildDay, dayKey, fmtTime, lastDays, useNow } from '../lib/utils'
import { Avatar, Card, Empty, StatCard, StatusBadge } from '../components/ui'

export default function Dashboard() {
  const { staff, records, loading } = useData()
  const now = useNow()
  const today = dayKey(now)

  const rows = useMemo(() => buildDay(staff, records, today), [staff, records, today])
  const total = staff.length
  const present = rows.filter((r) => r.present).length
  const absent = total - present
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  const week = useMemo(
    () =>
      lastDays(7).map((d) => {
        const p = buildDay(staff, records, dayKey(d)).filter((r) => r.present).length
        return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), present: p, absent: total - p }
      }),
    [staff, records, total],
  )

  const sorted = [...rows].sort((a, b) => {
    if (a.present !== b.present) return a.present ? -1 : 1
    return (a.timeIn?.getTime() ?? 0) - (b.timeIn?.getTime() ?? 0)
  })

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, Admin 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening with your staff today.</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="blue" icon={<Users size={22} />} label="Total Staff" value={total} note="Registered staff" />
        <StatCard
          tone="green"
          icon={<Clock size={22} />}
          label="Present Today"
          value={present}
          note={`${pct(present)}% of total staff`}
        />
        <StatCard
          tone="red"
          icon={<UserX size={22} />}
          label="Absent Today"
          value={absent}
          note={`${pct(absent)}% of total staff`}
        />
        <StatCard
          tone="violet"
          icon={<CalendarDays size={22} />}
          label="On Leave"
          value="-"
          note="Leave isn't tracked yet"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card
          title="Today's Attendance"
          className="xl:col-span-3"
          action={
            <Link to="/records" className="text-sm font-medium text-blue-600 hover:underline">
              View all
            </Link>
          }
        >
          {loading ? (
            <Empty>Loading...</Empty>
          ) : sorted.length === 0 ? (
            <Empty>No staff registered yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">ID</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Time In</th>
                    <th className="px-3 py-2 font-medium">Time Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.slice(0, 8).map((r) => (
                    <tr key={r.staff.staff_id}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.staff.full_name} />
                          <span className="font-medium">{r.staff.full_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{r.staff.staff_id}</td>
                      <td className="px-3 py-3">
                        <StatusBadge present={r.present} />
                      </td>
                      <td className="px-3 py-3 text-slate-600">{fmtTime(r.timeIn)}</td>
                      <td className="px-3 py-3 text-slate-600">{fmtTime(r.timeOut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Attendance Overview" className="xl:col-span-2" action={<span className="text-xs text-slate-500">Last 7 days</span>}>
          <div className="flex h-56 items-end gap-3 border-b border-slate-200 px-1">
            {week.map((d) => (
              <div key={d.label} className="flex h-full flex-1 flex-col justify-end" title={`${d.present} present, ${d.absent} absent`}>
                <div className="flex flex-col justify-end overflow-hidden rounded-t-md" style={{ height: total ? '100%' : 0 }}>
                  <div className="bg-slate-200" style={{ height: `${total ? (d.absent / total) * 100 : 0}%` }} />
                  <div className="bg-emerald-500" style={{ height: `${total ? (d.present / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 px-1 text-xs text-slate-500">
            {week.map((d) => (
              <div key={d.label} className="flex-1 text-center">
                <div>{d.label}</div>
                <div className="font-medium text-slate-700">{d.present}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm bg-slate-200" /> Absent
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
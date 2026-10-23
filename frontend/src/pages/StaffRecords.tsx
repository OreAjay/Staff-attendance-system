import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { api, type StaffHistory } from '../lib/api'
import { useData } from '../lib/data'
import { buildDay, dayKey, fmtTime, parseTs } from '../lib/utils'
import { Avatar, Card, Empty, StatusBadge, inputCls } from '../components/ui'

const PAGE_SIZE = 8

export default function StaffRecords() {
  const { staff, records } = useData()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [dept, setDept] = useState('all')
  const [status, setStatus] = useState<'all' | 'present' | 'absent'>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)

  const today = dayKey(new Date())
  const rows = useMemo(() => buildDay(staff, records, today), [staff, records, today])
  const departments = Array.from(new Set(staff.map((s) => s.department))).sort()

  const filtered = rows.filter((r) => {
    const term = q.trim().toLowerCase()
    if (term && !r.staff.full_name.toLowerCase().includes(term) && !r.staff.staff_id.toLowerCase().includes(term)) return false
    if (dept !== 'all' && r.staff.department !== dept) return false
    if (status === 'present' && !r.present) return false
    if (status === 'absent' && r.present) return false
    return true
  })

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Staff Records</h1>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })
                setPage(1)
              }}
              placeholder="Search staff by name or ID..."
              className={`${inputCls} pl-9`}
            />
          </div>
          <select
            value={dept}
            onChange={(e) => {
              setDept(e.target.value)
              setPage(1)
            }}
            className={`${inputCls} w-auto`}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status)
              setPage(1)
            }}
            className={`${inputCls} w-auto`}
          >
            <option value="all">All Status (today)</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <Empty>No staff match your filters.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Staff ID</th>
                  <th className="px-3 py-2 font-medium">Department</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Time In</th>
                  <th className="px-3 py-2 font-medium">Time Out</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slice.map((r) => (
                  <tr key={r.staff.staff_id}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.staff.full_name} size={30} />
                        <span className="font-medium">{r.staff.full_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{r.staff.staff_id}</td>
                    <td className="px-3 py-3 text-slate-600">{r.staff.department}</td>
                    <td className="px-3 py-3">
                      <StatusBadge present={r.present} />
                    </td>
                    <td className="px-3 py-3 text-slate-600">{fmtTime(r.timeIn)}</td>
                    <td className="px-3 py-3 text-slate-600">{fmtTime(r.timeOut)}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setSelected(r.staff.staff_id)}
                        className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}-
            {Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">
              Page {current} of {pages}
            </span>
            <button
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
              className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      {selected && <StaffDrawer staffId={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function StaffDrawer({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const [data, setData] = useState<StaffHistory | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    api
      .getStaffHistory(staffId)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Failed to load'))
    return () => {
      alive = false
    }
  }, [staffId])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">Attendance History</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!data && !error && <Empty>Loading...</Empty>}
        {data && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <Avatar name={data.staff.full_name} size={44} />
              <div>
                <div className="font-semibold">{data.staff.full_name}</div>
                <div className="text-sm text-slate-500">
                  {data.staff.staff_id} · {data.staff.department}
                </div>
              </div>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-700">{data.total_clock_ins}</div>
                <div className="text-xs text-emerald-700">Clock-ins</div>
              </div>
              <div className="rounded-lg bg-slate-100 p-3 text-center">
                <div className="text-2xl font-bold text-slate-700">{data.total_clock_outs}</div>
                <div className="text-xs text-slate-600">Clock-outs</div>
              </div>
            </div>
            {data.records.length === 0 ? (
              <Empty>No attendance records yet.</Empty>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.records.map((r) => {
                    const d = parseTs(r.timestamp)
                    return (
                      <tr key={r.id}>
                        <td className="px-3 py-2">{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-3 py-2">
                          <span className={r.action === 'clock_in' ? 'text-emerald-600' : 'text-slate-600'}>
                            {r.action === 'clock_in' ? 'Clock in' : 'Clock out'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{fmtTime(d)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}
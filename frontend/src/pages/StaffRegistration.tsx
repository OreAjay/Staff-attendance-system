import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { useData } from '../lib/data'
import { Avatar, Card, Empty, inputCls } from '../components/ui'
import { useToast } from '../components/Toast'

const DEFAULT_DEPARTMENTS = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales', 'Admin']

export default function StaffRegistration() {
  const { staff, refresh } = useData()
  const toast = useToast()
  const [fullName, setFullName] = useState('')
  const [staffId, setStaffId] = useState('')
  const [department, setDepartment] = useState('')
  const [busy, setBusy] = useState(false)

  const departments = Array.from(new Set([...DEFAULT_DEPARTMENTS, ...staff.map((s) => s.department)]))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await api.registerStaff({
        full_name: fullName.trim(),
        staff_id: staffId.trim(),
        department: department.trim(),
      })
      toast('success', `${fullName.trim()} registered`)
      setFullName('')
      setStaffId('')
      setDepartment('')
      await refresh()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Could not register staff')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Staff Registration</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Add New Staff">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className={inputCls}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Staff ID <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. STF006"
                  className={inputCls}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Department <span className="text-red-500">*</span>
              </span>
              <input
                required
                list="departments"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Select or type a department"
                className={inputCls}
              />
              <datalist id="departments">
                {departments.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Registering...' : 'Register Staff'}
            </button>
          </form>
        </Card>

        <Card title="Registered Staff" action={<span className="text-sm text-slate-500">{staff.length} total</span>}>
          {staff.length === 0 ? (
            <Empty>No staff registered yet.</Empty>
          ) : (
            <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
              {staff.map((s) => (
                <li key={s.staff_id} className="flex items-center gap-3 py-3">
                  <Avatar name={s.full_name} />
                  <span className="flex-1 text-sm font-medium">{s.full_name}</span>
                  <span className="w-24 text-sm text-slate-500">{s.staff_id}</span>
                  <span className="w-24 text-right text-sm text-slate-500">{s.department}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
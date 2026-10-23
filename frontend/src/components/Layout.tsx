import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Clock,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Search,
  Settings,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import { useData } from '../lib/data'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clock', label: 'Clock In / Out', icon: Clock },
  { to: '/register', label: 'Staff Registration', icon: UserPlus },
  { to: '/records', label: 'Staff Records', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const navigate = useNavigate()
  const { error, refresh } = useData()
  const [q, setQ] = useState('')
  const [spin, setSpin] = useState(false)

  function onSearch(e: FormEvent) {
    e.preventDefault()
    navigate(q.trim() ? `/records?q=${encodeURIComponent(q.trim())}` : '/records')
  }

  async function onRefresh() {
    setSpin(true)
    await refresh()
    setSpin(false)
  }

  return (
    <div className="flex min-h-screen font-sans">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-navy px-3 py-5 text-slate-300 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Clock size={20} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Staff Attendance</div>
            <div className="text-xs text-slate-400">System</div>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-navy-2 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <form onSubmit={onSearch} className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search staff by name or ID..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </form>
          <div className="flex items-center gap-4">
            <button
              onClick={onRefresh}
              title="Refresh data"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <RefreshCw size={18} className={spin ? 'animate-spin' : ''} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
                AD
              </div>
              <span className="text-sm font-medium">Admin</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-6 py-2.5 text-sm text-red-700">
            <TriangleAlert size={16} />
            {error} (start it with <code className="rounded bg-red-100 px-1">python app.py</code>)
          </div>
        )}

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
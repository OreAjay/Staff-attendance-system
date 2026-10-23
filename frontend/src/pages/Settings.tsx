import { CheckCircle2, XCircle } from 'lucide-react'
import { useData } from '../lib/data'
import { Card, inputCls } from '../components/ui'

export default function SettingsPage() {
  const { error, staff, records, refresh, refreshMs, setRefreshMs } = useData()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <div className="grid max-w-3xl gap-6">
        <Card title="Backend Connection">
          <div className="flex items-center gap-2 text-sm">
            {error ? (
              <>
                <XCircle size={18} className="text-red-500" />
                <span className="text-red-600">{error}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span className="text-emerald-700">
                  Connected · {staff.length} staff · {records.length} records
                </span>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            API URL: <code className="rounded bg-slate-100 px-1">{import.meta.env.VITE_API_URL || 'same origin (/api via Vite proxy)'}</code>
          </p>
          <button
            onClick={refresh}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Test connection
          </button>
        </Card>

        <Card title="Auto-refresh">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">How often should data reload from the server?</span>
            <select value={refreshMs} onChange={(e) => setRefreshMs(Number(e.target.value))} className={`${inputCls} w-auto`}>
              <option value={0}>Off (manual only)</option>
              <option value={10000}>Every 10 seconds</option>
              <option value={30000}>Every 30 seconds</option>
              <option value={60000}>Every minute</option>
            </select>
          </label>
        </Card>
      </div>
    </div>
  )
}
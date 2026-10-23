import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, type AttendanceRecord, type Staff } from './api'

interface DataCtx {
  staff: Staff[]
  records: AttendanceRecord[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  refreshMs: number
  setRefreshMs: (ms: number) => void
}

const Ctx = createContext<DataCtx | null>(null)

function readRefresh() {
  try {
    const v = Number(localStorage.getItem('refreshMs'))
    return Number.isFinite(v) && localStorage.getItem('refreshMs') !== null ? v : 30000
  } catch {
    return 30000
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshMs, setRefreshMsState] = useState(readRefresh)

  const refresh = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api.getStaff(), api.getRecords()])
      setStaff(s)
      setRecords(r)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!refreshMs) return
    const t = setInterval(refresh, refreshMs)
    return () => clearInterval(t)
  }, [refresh, refreshMs])

  const setRefreshMs = (ms: number) => {
    setRefreshMsState(ms)
    try {
      localStorage.setItem('refreshMs', String(ms))
    } catch {
      // ignore
    }
  }

  return (
    <Ctx.Provider value={{ staff, records, loading, error, refresh, refreshMs, setRefreshMs }}>
      {children}
    </Ctx.Provider>
  )
}

export function useData() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
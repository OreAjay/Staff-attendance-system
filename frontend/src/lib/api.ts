export type Action = 'clock_in' | 'clock_out'

export interface Staff {
  staff_id: string
  full_name: string
  department: string
}

export interface AttendanceRecord {
  id: number
  staff_id: string
  full_name: string | null
  department: string | null
  action: Action
  timestamp: string // "YYYY-MM-DD HH:MM:SS" in UTC (SQLite CURRENT_TIMESTAMP)
}

export interface StaffHistory {
  staff: Staff
  records: { id: number; action: Action; timestamp: string }[]
  total_clock_ins: number
  total_clock_outs: number
}

// Empty = same origin (Vite proxy forwards /api to Flask).
// Set VITE_API_URL in .env if the backend is hosted elsewhere.
const BASE: string = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0)
  }

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const msg = (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`
    throw new ApiError(msg, res.status)
  }
  return body as T
}

export const api = {
  getStaff: () => request<Staff[]>('/api/staff'),
  getRecords: () => request<AttendanceRecord[]>('/api/records'),
  getStaffHistory: (id: string) =>
    request<StaffHistory>(`/api/staff/${encodeURIComponent(id)}/records`),
  registerStaff: (s: Staff) =>
    request<{ message: string; staff_id: string }>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(s),
    }),
  record: (staff_id: string, action: Action) =>
    request<{ message: string; staff_id: string; action: Action }>('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ staff_id, action }),
    }),
}
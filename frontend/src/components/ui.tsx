import type { ReactNode } from 'react'
import { initials } from '../lib/utils'

const PALETTE = ['bg-slate-500', 'bg-blue-500', 'bg-indigo-500', 'bg-teal-600', 'bg-violet-500', 'bg-rose-500']

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const color = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length]
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${color}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name) || '?'}
    </div>
  )
}

export function StatusBadge({ present }: { present: boolean }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-medium ${
        present ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
      }`}
    >
      {present ? 'Present' : 'Absent'}
    </span>
  )
}

export function Card({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  note: ReactNode
  tone: 'blue' | 'green' | 'red' | 'violet'
}) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/60 text-blue-600',
    green: 'border-emerald-100 bg-emerald-50/70 text-emerald-600',
    red: 'border-red-100 bg-red-50/70 text-red-500',
    violet: 'border-violet-100 bg-violet-50/60 text-violet-600',
  }
  return (
    <div className={`rounded-xl border p-5 ${tones[tone]}`}>
      <div className="mb-3">{icon}</div>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{note}</div>
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-8 text-center text-sm text-slate-400">{children}</div>
}
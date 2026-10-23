import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

type Kind = 'success' | 'error'
interface Item {
  id: number
  kind: Kind
  msg: string
}

const ToastCtx = createContext<(kind: Kind, msg: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])

  const push = useCallback((kind: Kind, msg: string) => {
    const id = Date.now() + Math.random()
    setItems((i) => [...i, { id, kind, msg }])
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 4000)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed right-4 top-4 z-[60] space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`flex max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {t.kind === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
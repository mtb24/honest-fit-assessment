import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastState = {
  id: number
  message: string
}

type ToastContextValue = {
  showToast: (message: string) => void
}

const TOAST_DURATION_MS = 2400

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, TOAST_DURATION_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [toast])

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-xs rounded-md bg-slate-900/95 px-3 py-2 text-xs text-white shadow-lg ring-1 ring-slate-700">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.')
  }
  return context
}

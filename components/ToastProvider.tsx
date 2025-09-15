"use client"

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'
export type Toast = {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastContextType = {
  addToast: (t: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = String(++idRef.current)
    const toast: Toast = { id, duration: 3000, variant: 'info', ...t }
    setToasts((prev) => [...prev, toast])
    const duration = toast.duration ?? 3000
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, duration)
  }, [])

  const value = useMemo(() => ({ addToast }), [addToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 max-w-[90vw] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const color =
    toast.variant === 'success' ? 'border-blue-200 bg-blue-50 text-blue-900' :
    toast.variant === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
    toast.variant === 'warning' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' :
    'border-slate-200 bg-white text-slate-900'

  return (
    <div className={`pointer-events-auto overflow-hidden rounded-md border shadow-sm transition hover:shadow ${color}`}>
      <div className="flex items-start gap-3 p-3">
        <div className="flex-1">
          <div className="text-sm font-medium">{toast.title}</div>
          {toast.description && <div className="mt-0.5 text-xs opacity-80">{toast.description}</div>}
        </div>
        <button className="btn btn-ghost px-2 py-1 text-xs" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}


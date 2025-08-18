"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  description?: string
}

interface ToastContextValue {
  toasts: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>) => void
  remove: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <Toaster />')
  return ctx
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const push: ToastContextValue['push'] = toast => {
    const id = Math.random().toString(36).slice(2)
    setToasts(curr => [...curr, { id, ...toast }])
    setTimeout(() => remove(id), 4000)
  }

  const remove: ToastContextValue['remove'] = id => {
    setToasts(curr => curr.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={cn(
            'w-80 rounded-md border bg-white p-3 shadow-md transition-all',
            t.type === 'success' && 'border-emerald-200',
            t.type === 'error' && 'border-red-200',
            t.type === 'warning' && 'border-amber-200',
            t.type === 'info' && 'border-blue-200'
          )}>
            <div className="text-sm font-medium">
              {t.title || (t.type === 'success' ? '成功' : t.type === 'error' ? '错误' : t.type === 'warning' ? '提示' : '消息')}
            </div>
            {t.description && (
              <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
} 
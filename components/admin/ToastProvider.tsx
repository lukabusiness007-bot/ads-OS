"use client"

import * as React from "react"

type ToastTone = "neutral" | "success" | "danger"

type Toast = {
  id: string
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 4500

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const toast = React.useCallback((message: string, tone: ToastTone = "neutral") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }, [dismiss])

  const value = React.useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastStack" aria-live="polite" role="status">
        {toasts.map((entry) => (
          <div
            key={entry.id}
            className={`toast${entry.tone === "success" ? " toastSuccess" : entry.tone === "danger" ? " toastError" : ""}`}
            role={entry.tone === "danger" ? "alert" : "status"}
          >
            <span>{entry.message}</span>
            <button
              type="button"
              className="toastDismiss"
              aria-label="Dismiss notification"
              onClick={() => dismiss(entry.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

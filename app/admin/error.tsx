"use client"

import { useEffect } from "react"

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="panel" style={{ padding: 32, textAlign: "center" }} role="alert">
      <p className="eyebrow">Admin</p>
      <h1 style={{ marginBottom: 6 }}>Something went wrong</h1>
      <p className="muted" style={{ maxWidth: 480, marginInline: "auto" }}>
        This screen failed to load. You can try again — if it keeps happening, the error has been logged.
      </p>
      <button type="button" className="button accent" style={{ marginTop: 16 }} onClick={reset}>
        Try again
      </button>
    </div>
  )
}

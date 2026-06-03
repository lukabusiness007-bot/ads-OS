"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

export function ImpersonateButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [active, setActive] = React.useState(false)

  async function startImpersonation() {
    if (!confirm(`View as "${userName}"? This will be logged. A visible banner will appear.`)) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/impersonate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Request failed")
        return
      }
      setActive(true)
      // Store impersonation state in sessionStorage (read-only view; no real credential generated)
      sessionStorage.setItem("impersonating", JSON.stringify({ userId, name: userName }))
      router.push(`/admin/impersonate/view?userId=${userId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        className="button secondary sm"
        type="button"
        disabled={loading || active}
        onClick={startImpersonation}
      >
        {loading ? "…" : "View as merchant"}
      </button>
      {error && <p style={{ color: "var(--danger)", fontSize: 12, margin: "4px 0 0" }}>{error}</p>}
    </div>
  )
}

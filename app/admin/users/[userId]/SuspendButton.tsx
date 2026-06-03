"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

export function SuspendButton({ userId, suspended }: { userId: string; suspended: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function toggle() {
    if (!confirm(suspended ? "Reactivate this user?" : "Suspend this user? They will be blocked from publishing and generating.")) return

    setLoading(true)
    setError("")
    try {
      const endpoint = suspended ? `/api/admin/users/${userId}/unsuspend` : `/api/admin/users/${userId}/suspend`
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Request failed")
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        className={`button sm ${suspended ? "secondary" : ""}`}
        style={!suspended ? { background: "var(--danger)", color: "#fff" } : undefined}
        type="button"
        disabled={loading}
        onClick={toggle}
      >
        {loading ? "…" : suspended ? "Reactivate" : "Suspend"}
      </button>
      {error && <p style={{ color: "var(--danger)", fontSize: 12, margin: "4px 0 0" }}>{error}</p>}
    </div>
  )
}

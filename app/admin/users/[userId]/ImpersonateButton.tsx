"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/ToastProvider"

export function ImpersonateButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [active, setActive] = React.useState(false)

  async function startImpersonation() {
    if (!confirm(`View as "${userName}"? This will be logged. A visible banner will appear.`)) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/impersonate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? "Request failed. Try again.", "danger")
        return
      }
      setActive(true)
      toast(`Viewing as ${userName}.`, "neutral")
      // Store impersonation state in sessionStorage (read-only view; no real credential generated)
      sessionStorage.setItem("impersonating", JSON.stringify({ userId, name: userName }))
      router.push(`/admin/impersonate/view?userId=${userId}`)
    } catch {
      toast("Something went wrong — please try again.", "danger")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="button secondary sm"
      type="button"
      disabled={loading || active}
      onClick={startImpersonation}
    >
      {loading ? "…" : "View as merchant"}
    </button>
  )
}

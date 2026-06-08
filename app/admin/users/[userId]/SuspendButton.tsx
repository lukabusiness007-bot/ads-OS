"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/ToastProvider"

export function SuspendButton({ userId, suspended }: { userId: string; suspended: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  async function toggle() {
    let reason: string | undefined

    if (suspended) {
      if (!confirm("Reactivate this user?")) return
    } else {
      if (!confirm("Suspend this user? They will be blocked from publishing and generating.")) return
      const input = window.prompt("Reason for suspending this user (visible in the audit log):")
      if (input === null) return
      reason = input.trim() || undefined
    }

    setLoading(true)
    try {
      const endpoint = suspended ? `/api/admin/users/${userId}/unsuspend` : `/api/admin/users/${userId}/suspend`
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suspended ? {} : { reason })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? "Request failed. Try again.", "danger")
        return
      }
      toast(suspended ? "User reactivated." : "User suspended.", suspended ? "success" : "neutral")
      router.refresh()
    } catch {
      toast("Something went wrong — please try again.", "danger")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={`button sm ${suspended ? "secondary" : ""}`}
      style={!suspended ? { background: "var(--danger)", color: "#fff" } : undefined}
      type="button"
      disabled={loading}
      onClick={toggle}
    >
      {loading ? "…" : suspended ? "Reactivate" : "Suspend"}
    </button>
  )
}

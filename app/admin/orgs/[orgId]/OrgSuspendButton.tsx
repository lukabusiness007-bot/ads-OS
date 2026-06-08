"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/ToastProvider"

export function OrgSuspendButton({ orgId, suspended }: { orgId: string; suspended: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  async function toggle() {
    let reason: string | undefined

    if (suspended) {
      if (!confirm("Reactivate this organization?")) return
    } else {
      if (!confirm("Suspend this organization? All members will be blocked from publishing and generating.")) return
      const input = window.prompt("Reason for suspending this organization (visible in the audit log):")
      if (input === null) return
      reason = input.trim() || undefined
    }

    setLoading(true)
    try {
      const endpoint = suspended ? `/api/admin/orgs/${orgId}/unsuspend` : `/api/admin/orgs/${orgId}/suspend`
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
      toast(suspended ? "Organization reactivated." : "Organization suspended.", suspended ? "success" : "neutral")
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
      {loading ? "…" : suspended ? "Reactivate org" : "Suspend org"}
    </button>
  )
}

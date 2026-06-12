"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/ToastProvider"

export function AdminRoleButton({ userId, isAdmin, isSelf }: { userId: string; isAdmin: boolean; isSelf: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  async function toggle() {
    if (isAdmin) {
      if (!confirm("Remove platform admin access from this user?")) return
    } else {
      if (!confirm("Grant platform admin access to this user? They will get full access to the admin panel.")) return
    }

    setLoading(true)
    try {
      const endpoint = isAdmin ? `/api/admin/users/${userId}/revoke-admin` : `/api/admin/users/${userId}/grant-admin`
      const res = await fetch(endpoint, { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? "Request failed. Try again.", "danger")
        return
      }
      toast(isAdmin ? "Admin access removed." : "Admin access granted.", isAdmin ? "neutral" : "success")
      router.refresh()
    } catch {
      toast("Something went wrong — please try again.", "danger")
    } finally {
      setLoading(false)
    }
  }

  if (isAdmin && isSelf) {
    return <span className="badge neutral" title="You cannot remove your own admin access">Platform admin (you)</span>
  }

  return (
    <button
      className={`button sm ${isAdmin ? "secondary" : ""}`}
      type="button"
      disabled={loading}
      onClick={toggle}
    >
      {loading ? "…" : isAdmin ? "Remove admin role" : "Make platform admin"}
    </button>
  )
}

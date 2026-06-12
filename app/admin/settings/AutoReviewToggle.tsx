"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/ToastProvider"

export function AutoReviewToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [checked, setChecked] = React.useState(enabled)
  const [loading, setLoading] = React.useState(false)

  async function handleChange(next: boolean) {
    if (next && !confirm("Enable auto-review? Products that pass all AR-readiness checks will be approved automatically, without a human reviewer.")) {
      return
    }

    setLoading(true)
    setChecked(next)
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReviewEnabled: next })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? "Request failed. Try again.", "danger")
        setChecked(!next)
        return
      }
      toast(next ? "Auto-review enabled." : "Auto-review disabled.", next ? "success" : "neutral")
      router.refresh()
    } catch {
      toast("Something went wrong — please try again.", "danger")
      setChecked(!next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="toggleField">
      <div>
        <label htmlFor="auto-review-toggle">Auto-review</label>
        <p className="muted" style={{ margin: 0 }}>
          Automatically approve products that pass every AR-readiness check, without waiting for a
          human reviewer. Products with failing or warning checks always still need a human.
        </p>
      </div>
      <input
        id="auto-review-toggle"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={loading}
        onChange={(e) => void handleChange(e.target.checked)}
      />
    </div>
  )
}

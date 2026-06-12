"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/ToastProvider"
import type { ProductStatus } from "@/lib/types"

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "photos_uploaded", label: "Photos uploaded" },
  { value: "generating", label: "Generating" },
  { value: "generation_failed", label: "Generation failed" },
  { value: "awaiting_review", label: "Awaiting review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" }
]

export function StatusEditor({ productId, currentStatus }: { productId: string; currentStatus: ProductStatus }) {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = React.useState<ProductStatus>(currentStatus)
  const [reason, setReason] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const changed = status !== currentStatus

  async function applyChange() {
    if (!changed) return
    if (!confirm(`Change product status from "${currentStatus}" to "${status}"? This bypasses the normal review flow.`)) {
      return
    }

    setPending(true)
    try {
      const res = await fetch(`/api/admin/review/${productId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: reason.trim() || undefined })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? "Request failed. Try again.", "danger")
        return
      }
      toast(`Status changed to "${status}".`, "success")
      setReason("")
      router.refresh()
    } catch {
      toast("Something went wrong — please try again.", "danger")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="panel stack">
      <h2 style={{ margin: 0 }}>Override status</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        Manually set this product&apos;s status. Use sparingly — prefer the decision actions above for the normal review flow.
      </p>

      <div className="field">
        <label htmlFor="status-select">Status</label>
        <select
          id="status-select"
          value={status}
          disabled={pending}
          onChange={(e) => setStatus(e.target.value as ProductStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="status-reason">Reason (optional)</label>
        <input
          id="status-reason"
          type="text"
          value={reason}
          disabled={pending}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this status being changed manually?"
        />
      </div>

      <div className="inspectorActions">
        <button
          className="button secondary"
          type="button"
          disabled={!changed || pending}
          onClick={applyChange}
        >
          {pending ? "Saving…" : "Save status"}
        </button>
      </div>
    </div>
  )
}

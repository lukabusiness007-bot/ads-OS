"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { ProductStatus } from "@/lib/types"

type Decision = "approved" | "rejected" | "regenerate"

export function ReviewActions({
  productId,
  productName,
  adminId,
  currentStatus
}: {
  productId: string
  productName: string
  adminId: string
  currentStatus: ProductStatus
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState<Decision | null>(null)
  const [notes, setNotes] = React.useState("")
  const [error, setError] = React.useState("")
  const [done, setDone] = React.useState(false)

  async function decide(decision: Decision) {
    setError("")
    setPending(decision)

    try {
      const res = await fetch(`/api/admin/review/${productId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: notes.trim(), reviewerId: adminId })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Request failed. Try again.")
        return
      }

      setDone(true)
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  const disabled = !!pending

  if (done) {
    return (
      <div className="panel stack">
        <span className="badge success">Decision recorded</span>
        <p className="muted">The product status has been updated.</p>
        <button className="button secondary sm" type="button" onClick={() => { setDone(false); setNotes("") }}>
          Change decision
        </button>
      </div>
    )
  }

  return (
    <div className="panel stack">
      <h2 style={{ margin: 0 }}>Decision</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        Reviewing: <strong>{productName}</strong>
      </p>

      <div className="field">
        <label htmlFor="review-notes">Notes (optional)</label>
        <textarea
          id="review-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Visible to the merchant if rejected or changes requested."
          disabled={disabled}
          style={{ resize: "vertical" }}
        />
      </div>

      {error && <div className="assumptionNote">{error}</div>}

      <div className="inspectorActions">
        <button
          className="button accent"
          type="button"
          disabled={disabled || currentStatus === "approved"}
          onClick={() => decide("approved")}
        >
          {pending === "approved" ? "Approving…" : "✓ Approve"}
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={disabled}
          onClick={() => decide("regenerate")}
        >
          {pending === "regenerate" ? "Requesting…" : "↻ Request regeneration"}
        </button>
        <button
          className="button"
          type="button"
          disabled={disabled || currentStatus === "rejected"}
          style={{ background: "var(--danger)", color: "#fff" }}
          onClick={() => decide("rejected")}
        >
          {pending === "rejected" ? "Rejecting…" : "✕ Reject"}
        </button>
      </div>
    </div>
  )
}

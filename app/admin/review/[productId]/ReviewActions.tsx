"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/admin/ToastProvider"
import { evaluateArGate } from "@/lib/admin/ar-gate"
import type { ModelPackageCheck, ProductStatus } from "@/lib/types"

type Decision = "approved" | "rejected" | "regenerate"

const decisionVerb: Record<Decision, string> = {
  approved: "approved",
  rejected: "rejected",
  regenerate: "sent back for regeneration"
}

export function ReviewActions({
  productId,
  productName,
  currentStatus,
  modelChecks
}: {
  productId: string
  productName: string
  currentStatus: ProductStatus
  modelChecks: ModelPackageCheck[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, setPending] = React.useState<Decision | null>(null)
  const [notes, setNotes] = React.useState("")
  const [overrideReason, setOverrideReason] = React.useState("")

  const gate = React.useMemo(() => evaluateArGate(modelChecks), [modelChecks])
  const reasonGiven = overrideReason.trim().length > 0
  const approveBlocked = gate.status === "blocked" || (gate.status === "needs_reason" && !reasonGiven)

  async function decide(decision: Decision) {
    setPending(decision)

    const combinedNotes = decision === "approved" && reasonGiven
      ? [notes.trim(), `AR-ready override: ${overrideReason.trim()}`].filter(Boolean).join("\n\n")
      : notes.trim()

    try {
      const res = await fetch(`/api/admin/review/${productId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: combinedNotes })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? "Request failed. Try again.", "danger")
        return
      }

      toast(`${productName} ${decisionVerb[decision]}.`, decision === "rejected" ? "neutral" : "success")
      setNotes("")
      setOverrideReason("")
      router.refresh()
    } catch {
      toast("Something went wrong — please try again.", "danger")
    } finally {
      setPending(null)
    }
  }

  const disabled = !!pending

  // The button stays clickable while the gate blocks approval so the click
  // always gets feedback — a silently disabled button reads as "broken".
  function handleApprove() {
    if (gate.status === "blocked") {
      toast("Approval is blocked while checks are failing — see the list above.", "danger")
      return
    }
    if (gate.status === "needs_reason" && !reasonGiven) {
      toast("Add an override reason above before approving.", "danger")
      return
    }
    void decide("approved")
  }

  return (
    <div className="panel stack">
      <h2 style={{ margin: 0 }}>Decision</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        Reviewing: <strong>{productName}</strong>
      </p>

      {gate.status === "blocked" && (
        <div className="arGateNotice arGateNoticeBlocked">
          <strong>Approve is blocked</strong> until these checks stop failing:
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {gate.failing.map((check) => (
              <li key={check.id}>{check.label} — {check.detail}</li>
            ))}
          </ul>
        </div>
      )}

      {gate.status === "needs_reason" && (
        <div className="arGateNotice arGateNoticeWarning stack">
          <div>
            <strong>These checks need a closer look:</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {gate.warnings.map((check) => (
                <li key={check.id}>{check.label} — {check.detail}</li>
              ))}
            </ul>
          </div>
          <div className="field">
            <label htmlFor="ar-override-reason">Override reason (required to approve)</label>
            <input
              id="ar-override-reason"
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Why is this OK to approve despite the warning?"
              disabled={disabled}
            />
          </div>
        </div>
      )}

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

      <div className="inspectorActions">
        <button
          className="button accent"
          type="button"
          disabled={disabled || currentStatus === "approved"}
          aria-disabled={approveBlocked || undefined}
          style={approveBlocked ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
          title={
            gate.status === "blocked"
              ? "Resolve the failing checks before approving"
              : gate.status === "needs_reason" && !reasonGiven
                ? "Add an override reason before approving"
                : undefined
          }
          onClick={handleApprove}
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

"use client"

export function BulkActionBar({
  count,
  pending,
  onApprove,
  onReject,
  onClear
}: {
  count: number
  pending?: boolean
  onApprove: () => void
  onReject: () => void
  onClear: () => void
}) {
  if (count === 0) return null

  return (
    <div className="bulkActionBar" role="toolbar" aria-label="Bulk actions">
      <span>
        <strong>{count}</strong> selected
      </span>
      <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="button secondary sm" onClick={onClear} disabled={pending}>
          Clear
        </button>
        <button type="button" className="button secondary sm" onClick={onReject} disabled={pending}>
          Reject
        </button>
        <button type="button" className="button accent sm" onClick={onApprove} disabled={pending}>
          Approve
        </button>
      </div>
    </div>
  )
}

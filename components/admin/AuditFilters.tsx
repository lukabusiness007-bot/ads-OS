"use client"

import { useFilterNavigation } from "./useFilterNavigation"

export type AuditFilterOption = { value: string; label: string }

/**
 * URL-state filter bar for the audit log: action/target saved-view tabs plus
 * an actor select and a date range, all pushed to searchParams so the page
 * stays an async server component (mirrors the FilterControls pattern).
 */
export function AuditFilters({
  actionOptions,
  targetOptions,
  actorOptions
}: {
  actionOptions: AuditFilterOption[]
  targetOptions: AuditFilterOption[]
  actorOptions: AuditFilterOption[]
}) {
  const { navigate, searchParams, pathname, router } = useFilterNavigation()

  const action = searchParams.get("action") ?? ""
  const targetType = searchParams.get("targetType") ?? ""
  const actor = searchParams.get("actor") ?? ""
  const from = searchParams.get("from") ?? ""
  const to = searchParams.get("to") ?? ""

  const hasFilters = Boolean(action || targetType || actor || from || to)

  return (
    <div className="stack" style={{ gap: 12, marginBottom: 20 }}>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {actionOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`button ${action === opt.value ? "accent" : "secondary"} sm`}
            aria-pressed={action === opt.value}
            onClick={() => navigate({ action: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {targetOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`button ${targetType === opt.value ? "accent" : "secondary"} sm`}
            aria-pressed={targetType === opt.value}
            onClick={() => navigate({ targetType: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ minWidth: 200 }}>
          <label htmlFor="audit-actor">Actor</label>
          <select id="audit-actor" value={actor} onChange={(e) => navigate({ actor: e.target.value })}>
            {actorOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 160 }}>
          <label htmlFor="audit-from">From</label>
          <input id="audit-from" type="date" value={from} max={to || undefined} onChange={(e) => navigate({ from: e.target.value })} />
        </div>
        <div className="field" style={{ minWidth: 160 }}>
          <label htmlFor="audit-to">To</label>
          <input id="audit-to" type="date" value={to} min={from || undefined} onChange={(e) => navigate({ to: e.target.value })} />
        </div>
        {hasFilters && (
          <button type="button" className="button secondary sm" onClick={() => router.push(pathname)}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

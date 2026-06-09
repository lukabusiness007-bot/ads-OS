const SKELETON = { background: "var(--surface-2)", borderRadius: 4, border: "none" } as const

export default function AdminReviewLoading() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      {/* PageHeader */}
      <header className="topbar">
        <div className="stack" style={{ gap: 6 }}>
          <div style={{ ...SKELETON, width: 48, height: 11 }} />
          <div style={{ ...SKELETON, width: 140, height: 22 }} />
          <div style={{ ...SKELETON, width: 320, height: 13 }} />
        </div>
      </header>

      {/* FilterControls: 4 tabs + search */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ ...SKELETON, width: 80, height: 30, borderRadius: 6 }} />
        ))}
        <div style={{ ...SKELETON, width: 200, height: 30, borderRadius: 6, marginLeft: "auto" }} />
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
          {[32, 160, 100, 60, 80, 70, 60].map((w, i) => (
            <div key={i} style={{ ...SKELETON, width: w, height: 11 }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div key={row} style={{ display: "flex", gap: 12, padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            {[32, 160, 100, 60, 80, 70, 60].map((w, i) => (
              <div key={i} style={{ ...SKELETON, width: w, height: 13 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const SKELETON = { background: "var(--surface-2)", borderRadius: 4, border: "none" } as const

export default function AdminUsersLoading() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      {/* PageHeader */}
      <header className="topbar">
        <div className="stack" style={{ gap: 6 }}>
          <div style={{ ...SKELETON, width: 48, height: 11 }} />
          <div style={{ ...SKELETON, width: 100, height: 22 }} />
          <div style={{ ...SKELETON, width: 180, height: 13 }} />
        </div>
      </header>

      {/* FilterControls: 3 tabs + search */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ ...SKELETON, width: 84, height: 30, borderRadius: 6 }} />
        ))}
        <div style={{ ...SKELETON, width: 220, height: 30, borderRadius: 6, marginLeft: "auto" }} />
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
          {[120, 160, 100, 80, 60, 70, 40].map((w, i) => (
            <div key={i} style={{ ...SKELETON, width: w, height: 11 }} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, row) => (
          <div key={row} style={{ display: "flex", gap: 12, padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
            {[120, 160, 100, 80, 60, 70, 40].map((w, i) => (
              <div key={i} style={{ ...SKELETON, width: w, height: 13 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

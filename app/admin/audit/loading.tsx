const SKELETON = { background: "var(--surface-2)", borderRadius: 4, border: "none" } as const

export default function AdminAuditLoading() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      {/* PageHeader */}
      <header className="topbar">
        <div className="stack" style={{ gap: 6 }}>
          <div style={{ ...SKELETON, width: 48, height: 11 }} />
          <div style={{ ...SKELETON, width: 100, height: 22 }} />
          <div style={{ ...SKELETON, width: 160, height: 13 }} />
        </div>
      </header>

      {/* AuditFilters: 3 selects + 2 date inputs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ ...SKELETON, width: 140, height: 30, borderRadius: 6 }} />
        ))}
        <div style={{ ...SKELETON, width: 120, height: 30, borderRadius: 6 }} />
        <div style={{ ...SKELETON, width: 120, height: 30, borderRadius: 6 }} />
      </div>

      {/* Table (single wide column for audit entries) */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ ...SKELETON, width: 60, height: 11 }} />
        </div>
        {Array.from({ length: 10 }).map((_, row) => (
          <div key={row} style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ ...SKELETON, width: "65%", height: 13, marginBottom: 6 }} />
            <div style={{ ...SKELETON, width: "40%", height: 11 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

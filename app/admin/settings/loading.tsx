const SKELETON = { background: "var(--surface-2)", borderRadius: 4, border: "none" } as const

export default function AdminSettingsLoading() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      {/* PageHeader */}
      <header className="topbar">
        <div className="stack" style={{ gap: 6 }}>
          <div style={{ ...SKELETON, width: 48, height: 11 }} />
          <div style={{ ...SKELETON, width: 100, height: 22 }} />
          <div style={{ ...SKELETON, width: 260, height: 13 }} />
        </div>
      </header>

      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="panel stack" style={{ gap: 16 }}>
          <div className="stack" style={{ gap: 6 }}>
            <div style={{ ...SKELETON, width: 160, height: 16 }} />
            <div style={{ ...SKELETON, width: 280, height: 13 }} />
          </div>
          <div style={{ ...SKELETON, width: "100%", height: 56, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  )
}

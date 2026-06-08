export default function AdminLoading() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      <p className="muted">Loading…</p>
      <div className="panel" style={{ height: 84, background: "var(--surface-2)", border: "none" }} />
      <div className="grid four">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card metric" style={{ height: 92, background: "var(--surface-2)", border: "none" }} />
        ))}
      </div>
      <div className="panel" style={{ height: 280, background: "var(--surface-2)", border: "none" }} />
    </div>
  )
}

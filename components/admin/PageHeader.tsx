import type { ReactNode } from "react"

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action
}: {
  eyebrow: string
  title: string
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 style={{ marginBottom: 6 }}>{title}</h1>
        {subtitle && (
          <p className="muted" style={{ maxWidth: 560 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  )
}

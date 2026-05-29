"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, PlusSquare, Link2, BarChart2 } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Products", icon: LayoutGrid },
  { href: "/create", label: "Create AR Page", icon: PlusSquare },
  { href: "/published-links", label: "Published Links", icon: Link2 },
  { href: "/analytics-billing", label: "Analytics / Billing", icon: BarChart2 },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">AR</span>
          <strong>Veridian</strong>
          <span>Pilot Command Center</span>
        </div>

        <nav className="nav" aria-label="Primary">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            return (
              <Link
                href={href}
                key={href}
                className={isActive ? "navActive" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={15} strokeWidth={2} aria-hidden />
                {label}
              </Link>
            )
          })}
        </nav>

        <p className="sidebarFooter">
          Models are human-reviewed before publishing. Pilot: 10–25 products.
        </p>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}

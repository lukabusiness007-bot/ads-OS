"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, PlusSquare, Link2, BarChart2, CreditCard, LogOut } from "lucide-react"
import { useLang } from "@/lib/lang"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { tr, toggle } = useLang()
  const n = tr.nav

  const navItems = [
    { href: "/dashboard", label: n.products, icon: LayoutGrid },
    { href: "/create", label: n.createAr, icon: PlusSquare },
    { href: "/published-links", label: n.publishedLinks, icon: Link2 },
    { href: "/analytics", label: n.analytics, icon: BarChart2 },
    { href: "/billing", label: n.billing, icon: CreditCard },
  ]

  async function handleLogout() {
    if (isSupabaseConfigured()) {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
    }

    router.push("/")
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandLeft">
            <span className="brandMark">AR</span>
            <strong>Veridian</strong>
            <span>{n.brand}</span>
            <span className="badge warning" style={{ alignSelf: "flex-start", marginTop: 2 }}>
              {n.demoBadge}
            </span>
          </div>
          <button
            className="langPill"
            type="button"
            onClick={toggle}
            aria-label="Promeni jezik / Switch language"
          >
            {tr.langToggle}
          </button>
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

        <button className="logoutButton" type="button" onClick={handleLogout}>
          <LogOut size={15} strokeWidth={2} aria-hidden />
          {n.logout}
        </button>

        <p className="sidebarFooter">{n.footer}</p>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}

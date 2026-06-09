"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, PlusSquare, Link2, BarChart2, CreditCard, LogOut, Menu, X } from "lucide-react"
import { useLang } from "@/lib/lang"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Logo } from "@/components/Logo"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { tr, toggle } = useLang()
  const n = tr.nav
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
      <header className="mobileAppBar">
        <Link href="/dashboard" className="mobileBrand" aria-label="augmenta3D dashboard">
          <Logo
            theme="dark"
            markClassName="brandMark"
            wordmarkClassName="text-2xl font-semibold leading-none tracking-tight"
          />
        </Link>
        <button
          className="mobileNavButton"
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
          aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
        >
          {mobileNavOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
      </header>

      {mobileNavOpen && (
        <button
          className="sidebarBackdrop"
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={mobileNavOpen ? "sidebar sidebarOpen" : "sidebar"} id="app-sidebar">
        <div className="brand">
          <div className="brandLeft">
            <Logo
              theme="dark"
              markClassName="brandMark brandMarkLg"
              wordmarkClassName="!text-2xl font-semibold !leading-none tracking-tight"
            />
          </div>
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
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon size={15} strokeWidth={2} aria-hidden />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="sidebarBottom">
          <button className="logoutButton" type="button" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={2} aria-hidden />
            {n.logout}
          </button>
          <button
            className="langPill"
            type="button"
            onClick={toggle}
            aria-label="Promeni jezik / Switch language"
          >
            {tr.langToggle}
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}

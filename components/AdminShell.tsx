"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, CheckSquare, Users, Building2, ScrollText, LogOut, Menu, X } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/NotificationBell"
import { Logo } from "@/components/Logo"
import { ToastProvider } from "@/components/admin/ToastProvider"
import { CommandPalette } from "@/components/admin/CommandPalette"

const navItems = [
  { href: "/admin",        label: "Overview",     icon: LayoutGrid  },
  { href: "/admin/review", label: "Review Queue", icon: CheckSquare },
  { href: "/admin/users",  label: "Users",        icon: Users       },
  { href: "/admin/orgs",   label: "Orgs",         icon: Building2   },
  { href: "/admin/audit",  label: "Audit Log",    icon: ScrollText  },
]

export function AdminShell({
  children,
  impersonating,
  impersonatedName
}: {
  children: React.ReactNode
  impersonating?: boolean
  impersonatedName?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  async function handleLogout() {
    if (isSupabaseConfigured()) {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
    }
    router.push("/login")
  }

  return (
    <>
      {impersonating && (
        <div className="impersonationBanner" role="alert">
          <span>
            <strong>Viewing as:</strong> {impersonatedName ?? "Merchant"}
          </span>
          <Link href="/admin/impersonate/stop" className="button ghost sm">
            Exit view
          </Link>
        </div>
      )}
      <div className="appShell">
        <header className="mobileAppBar">
          <Link href="/admin" className="mobileBrand" aria-label="augmenta3D admin">
            <Logo theme="dark" markClassName="brandMark" />
            <small>Admin</small>
          </Link>
          <button
            className="mobileNavButton"
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-expanded={mobileNavOpen}
            aria-controls="admin-sidebar"
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

        <aside className={mobileNavOpen ? "sidebar sidebarOpen" : "sidebar"} id="admin-sidebar">
          <div className="brand">
            <div className="brandLeft">
              <Logo theme="dark" markClassName="brandMark" />
              <span>Admin</span>
              <span className="badge danger" style={{ alignSelf: "flex-start", marginTop: 2 }}>
                Internal
              </span>
            </div>
            <NotificationBell />
          </div>

          <nav className="nav" aria-label="Admin">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href)
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

          <button className="logoutButton" type="button" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={2} aria-hidden />
            Sign out
          </button>

          <p className="sidebarFooter">Platform admin — internal only</p>
        </aside>
        <main className="main">
          <ToastProvider>
            {children}
            <CommandPalette />
          </ToastProvider>
        </main>
      </div>
    </>
  )
}

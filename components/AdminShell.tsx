"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, CheckSquare, Users, Building2, ScrollText, LogOut, Bell } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/NotificationBell"

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
        <aside className="sidebar">
          <div className="brand">
            <div className="brandLeft">
              <span className="brandMark">AR</span>
              <strong>Veridian</strong>
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
        <main className="main">{children}</main>
      </div>
    </>
  )
}

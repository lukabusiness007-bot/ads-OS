import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Products" },
  { href: "/create", label: "Create AR Page" },
  { href: "/published-links", label: "Published Links" },
  { href: "/analytics-billing", label: "Analytics/Billing" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">AR</span>
          <strong>Veridian AR Commerce</strong>
          <span>Verified hosted AR product pages for furniture and home decor stores.</span>
        </div>

        <nav className="nav" aria-label="Primary">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="sidebarFooter">
          Pilot Command Center for your first 10-25 products. Models are human-reviewed before publishing.
        </p>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getAdminOverviewStats } from "@/lib/admin/data";
import { StatusBadge } from "@/components/StatusBadge";
import type { ProductStatus } from "@/lib/types";

export default async function AdminOverviewPage() {
  const admin = await requirePlatformAdmin("/admin");
  if (!admin) return null;

  const stats = await getAdminOverviewStats(admin);

  const statCards = [
    { label: "Awaiting review", value: stats.awaiting_review, href: "/admin/review", tone: "warning" },
    { label: "Generating", value: stats.generating, href: "/admin/review?status=generating", tone: "neutral" },
    { label: "Generation failed", value: stats.generation_failed, href: "/admin/review?status=generation_failed", tone: "danger" },
    { label: "Published", value: stats.published, href: "/admin/review?status=published", tone: "success" },
    { label: "Total merchants", value: stats.total_merchants, href: "/admin/users", tone: "neutral" },
    { label: "New signups (7d)", value: stats.new_signups_7d, href: "/admin/users", tone: "neutral" },
    { label: "New signups (30d)", value: stats.new_signups_30d, href: "/admin/users", tone: "neutral" },
  ] as const;

  return (
    <>
      <header>
        <p className="eyebrow">Platform admin</p>
        <h1>Overview</h1>
        <p className="muted">At-a-glance health across all merchants and models.</p>
      </header>

      <section>
        <div className="grid four" style={{ gap: 12, marginBottom: 32 }}>
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              style={{ textDecoration: "none" }}
            >
              <div className="statCard">
                <span className="statNumber">{card.value}</span>
                <span className="statLabel">{card.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Needs your attention</h2>
          <Link href="/admin/review" className="button secondary sm">
            View all →
          </Link>
        </div>

        {stats.needs_attention.length === 0 ? (
          <p className="muted">All clear — nothing pending review or failed generation.</p>
        ) : (
          <table className="adminTable">
            <thead>
              <tr>
                <th>Product</th>
                <th>Merchant</th>
                <th>Status</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stats.needs_attention.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td className="muted">{item.org_name}</td>
                  <td>
                    <StatusBadge status={item.status as ProductStatus} />
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {new Date(item.updated_at).toLocaleString()}
                  </td>
                  <td>
                    <Link href={`/admin/review/${item.id}`} className="button secondary sm">
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

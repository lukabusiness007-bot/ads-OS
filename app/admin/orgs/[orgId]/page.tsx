import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getOrganizationDetail } from "@/lib/admin/data";
import { StatusBadge } from "@/components/StatusBadge";
import { OrgSuspendButton } from "./OrgSuspendButton";
import type { ProductStatus } from "@/lib/types";

export default async function AdminOrgDetailPage({
  params
}: {
  params: Promise<{ orgId: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/orgs");
  if (!admin) return null;

  const { orgId } = await params;

  let detail: Awaited<ReturnType<typeof getOrganizationDetail>> | null = null;
  try {
    detail = await getOrganizationDetail(admin, orgId);
  } catch {
    return (
      <>
        <header>
          <Link href="/admin/orgs" className="textLink">← Back to orgs</Link>
          <h1>Organization not found</h1>
        </header>
      </>
    );
  }

  const { org, members, subscription, products, recentAudit } = detail;

  return (
    <>
      <header>
        <div className="row" style={{ alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Link href="/admin/orgs" className="textLink" style={{ fontSize: 13 }}>← Back to orgs</Link>
            <h1 style={{ marginTop: 4 }}>{org.name}</h1>
            <p className="muted">
              slug: {org.slug}
              {org.website && <> · <a href={org.website} target="_blank" rel="noreferrer" className="textLink">{org.website}</a></>}
              {" · "}Created {new Date(org.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {org.suspended_at ? (
              <span className="badge danger">Suspended</span>
            ) : (
              <span className="badge success">Active</span>
            )}
            <OrgSuspendButton orgId={org.id} suspended={!!org.suspended_at} />
          </div>
        </div>
      </header>

      <div className="grid two" style={{ gap: 20, alignItems: "start" }}>
        {/* Left: plan, members, audit */}
        <div className="stack">
          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Plan & billing</h2>
            <table style={{ fontSize: 13, borderCollapse: "collapse", width: "100%" }}>
              <tbody>
                <tr>
                  <td className="muted" style={{ padding: "4px 8px 4px 0", width: 140 }}>Plan</td>
                  <td><span className="badge neutral">{org.plan_key}</span></td>
                </tr>
                {subscription && (
                  <>
                    <tr>
                      <td className="muted" style={{ padding: "4px 8px 4px 0" }}>Sub status</td>
                      <td>
                        <span className={`badge ${subscription.status === "active" ? "success" : "warning"}`}>
                          {subscription.status}
                        </span>
                      </td>
                    </tr>
                    {subscription.current_period_end && (
                      <tr>
                        <td className="muted" style={{ padding: "4px 8px 4px 0" }}>Period ends</td>
                        <td style={{ padding: "4px 0" }}>
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Members ({members.length})</h2>
            {members.length === 0 ? (
              <p className="muted">No members.</p>
            ) : (
              <table className="adminTable">
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.user_id}>
                      <td style={{ fontWeight: 600 }}>
                        {m.profile?.full_name ?? m.profile?.email ?? m.user_id}
                      </td>
                      <td><span className="badge neutral">{m.role}</span></td>
                      <td>
                        {m.profile?.suspended_at ? (
                          <span className="badge danger">Suspended</span>
                        ) : (
                          <span className="badge success">Active</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/admin/users/${m.user_id}`} className="button secondary sm">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Recent audit activity</h2>
            {recentAudit.length === 0 ? (
              <p className="muted">No audit events.</p>
            ) : (
              <table className="adminTable">
                <thead>
                  <tr><th>Action</th><th>Actor</th><th>When</th></tr>
                </thead>
                <tbody>
                  {recentAudit.map((entry) => (
                    <tr key={entry.id}>
                      <td><span className="badge neutral">{entry.action}</span></td>
                      <td className="muted" style={{ fontSize: 12 }}>
                        {entry.actor?.full_name ?? entry.actor?.email ?? entry.actor_id ?? "system"}
                      </td>
                      <td className="muted" style={{ fontSize: 12 }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: products */}
        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Products ({products.length})</h2>
          {products.length === 0 ? (
            <p className="muted">No products yet.</p>
          ) : (
            <table className="adminTable">
              <thead>
                <tr><th>Name</th><th>Status</th><th>Updated</th><th></th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><StatusBadge status={p.status as ProductStatus} /></td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td>
                      {(p.status === "awaiting_review" || p.status === "generation_failed") && (
                        <Link href={`/admin/review/${p.id}`} className="button accent sm">
                          Review →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

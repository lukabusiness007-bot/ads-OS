import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getUserDetail } from "@/lib/admin/data";
import { StatusBadge } from "@/components/StatusBadge";
import { SuspendButton } from "./SuspendButton";
import { ImpersonateButton } from "./ImpersonateButton";
import type { ProductStatus } from "@/lib/types";

export default async function AdminUserDetailPage({
  params
}: {
  params: Promise<{ userId: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/users");
  if (!admin) return null;

  const { userId } = await params;

  let detail: Awaited<ReturnType<typeof getUserDetail>> | null = null;
  try {
    detail = await getUserDetail(admin, userId);
  } catch {
    return (
      <>
        <header>
          <Link href="/admin/users" className="textLink">← Back to users</Link>
          <h1>User not found</h1>
        </header>
      </>
    );
  }

  const { profile, orgs, products, recentAudit } = detail;

  return (
    <>
      <header>
        <div className="row" style={{ alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Link href="/admin/users" className="textLink" style={{ fontSize: 13 }}>← Back to users</Link>
            <h1 style={{ marginTop: 4 }}>{profile.full_name ?? profile.email ?? "User"}</h1>
            <p className="muted">
              {profile.email}
              {profile.username && <> · @{profile.username}</>}
              {" · "}Joined {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {profile.suspended_at ? (
              <span className="badge danger">Suspended</span>
            ) : (
              <span className="badge success">Active</span>
            )}
            <SuspendButton
              userId={userId}
              suspended={!!profile.suspended_at}
            />
            <ImpersonateButton
              userId={userId}
              userName={profile.full_name ?? profile.email ?? "User"}
            />
          </div>
        </div>
      </header>

      <div className="grid two" style={{ gap: 20, alignItems: "start" }}>
        {/* Left col */}
        <div className="stack">
          {/* Organizations & plans */}
          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Organizations</h2>
            {orgs.length === 0 ? (
              <p className="muted">No orgs found.</p>
            ) : (
              orgs.map((org) => (
                <div key={org.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="row">
                    <Link href={`/admin/orgs/${org.id}`} className="textLink" style={{ fontWeight: 600 }}>
                      {org.name}
                    </Link>
                    <span className="badge neutral">{org.role}</span>
                    {org.suspended_at && <span className="badge danger">Org suspended</span>}
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                    Plan: {org.subscription?.plan_key ?? org.plan_key}
                    {org.subscription && ` · ${org.subscription.status}`}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Recent audit events */}
          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Recent audit activity</h2>
            {recentAudit.length === 0 ? (
              <p className="muted">No audit events.</p>
            ) : (
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudit.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <span className="badge neutral">{entry.action}</span>
                      </td>
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

        {/* Right col: products */}
        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Products ({products.length})</h2>
          {products.length === 0 ? (
            <p className="muted">No products.</p>
          ) : (
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <StatusBadge status={p.status as ProductStatus} />
                    </td>
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

import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getUserDetail } from "@/lib/admin/data";
import { StatusBadge } from "@/components/StatusBadge";
import type { ProductStatus } from "@/lib/types";

export default async function ImpersonateViewPage({
  searchParams
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const admin = await requirePlatformAdmin("/admin");
  if (!admin) return null;

  const { userId } = await searchParams;
  if (!userId) {
    return (
      <div className="panel">
        <p className="muted">No user selected. <Link href="/admin/users" className="textLink">Back to users</Link></p>
      </div>
    );
  }

  let detail: Awaited<ReturnType<typeof getUserDetail>> | null = null;
  try {
    detail = await getUserDetail(admin, userId);
  } catch {
    return (
      <div className="panel">
        <p className="muted">User not found. <Link href="/admin/users" className="textLink">Back to users</Link></p>
      </div>
    );
  }

  const { profile, orgs, products } = detail;

  return (
    <>
      {/* Persistent impersonation banner — rendered in AdminShell via layout but we also inline here */}
      <div className="impersonationBanner" role="alert">
        <span>
          <strong>Viewing as:</strong> {profile.full_name ?? profile.email} (read-only)
        </span>
        <ImpersonateStop userId={userId} />
      </div>

      <header>
        <p className="eyebrow">Viewing as merchant</p>
        <h1>{profile.full_name ?? profile.email}</h1>
        <p className="muted">
          This is a read-only view. All actions are disabled.
        </p>
      </header>

      <div className="grid two" style={{ gap: 20, alignItems: "start" }}>
        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Organizations</h2>
          {orgs.map((org) => (
            <div key={org.id}>
              <strong>{org.name}</strong>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
                Plan: {org.subscription?.plan_key ?? org.plan_key}
                {org.suspended_at && <span className="badge danger" style={{ marginLeft: 8 }}>Suspended</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Products</h2>
          {products.length === 0 ? (
            <p className="muted">No products.</p>
          ) : (
            <table className="adminTable">
              <thead>
                <tr><th>Name</th><th>Status</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td><StatusBadge status={p.status as ProductStatus} /></td>
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

// Inline stop button to keep this page as a single server file
function ImpersonateStop({ userId }: { userId: string }) {
  return (
    <form action={`/api/admin/impersonate/stop`} method="POST" style={{ display: "inline" }}>
      <input type="hidden" name="targetUserId" value={userId} />
      <Link href="/admin" className="button ghost sm">
        Exit view →
      </Link>
    </form>
  );
}

import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { listOrganizations } from "@/lib/admin/data";

export default async function AdminOrgsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/orgs");
  if (!admin) return null;

  const { search = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  const { rows, total } = await listOrganizations(admin, { search, page: currentPage });
  const totalPages = Math.ceil(total / 25);

  return (
    <>
      <header>
        <p className="eyebrow">Admin</p>
        <h1>Organizations</h1>
        <p className="muted">{total.toLocaleString()} total orgs</p>
      </header>

      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        <form method="GET" style={{ display: "flex", gap: 8, flex: 1, minWidth: 240 }}>
          <input
            name="search"
            defaultValue={search}
            placeholder="Search org name…"
            className="field"
            style={{ flex: 1, margin: 0 }}
          />
          <button className="button secondary sm" type="submit">Search</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center" }}>
          <p className="muted">No organizations found.</p>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="adminTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Plan</th>
                <th>Members</th>
                <th>Products</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((org) => (
                <tr key={org.id}>
                  <td style={{ fontWeight: 600 }}>{org.name}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{org.slug}</td>
                  <td><span className="badge neutral">{org.plan_key}</span></td>
                  <td className="muted">{org.member_count}</td>
                  <td className="muted">{org.product_count}</td>
                  <td>
                    {org.suspended_at ? (
                      <span className="badge danger">Suspended</span>
                    ) : (
                      <span className="badge success">Active</span>
                    )}
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <Link href={`/admin/orgs/${org.id}`} className="button secondary sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: "center" }}>
          {currentPage > 1 && (
            <Link href={`/admin/orgs?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`} className="button secondary sm">
              ← Prev
            </Link>
          )}
          <span className="muted" style={{ lineHeight: "32px", fontSize: 13 }}>
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={`/admin/orgs?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`} className="button secondary sm">
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { listUsers } from "@/lib/admin/data";

const STATUS_OPTIONS = [
  { value: "all",       label: "All users" },
  { value: "active",    label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/users");
  if (!admin) return null;

  const { search = "", status = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  const { rows, total } = await listUsers(admin, {
    search,
    status: status as "all" | "active" | "suspended",
    page: currentPage,
    pageSize: 25
  });

  const totalPages = Math.ceil(total / 25);

  return (
    <>
      <header>
        <p className="eyebrow">Admin</p>
        <h1>Users</h1>
        <p className="muted">{total.toLocaleString()} total merchants</p>
      </header>

      {/* Filters */}
      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <form method="GET" style={{ display: "flex", gap: 8, flex: 1, minWidth: 240 }}>
          <input
            name="search"
            defaultValue={search}
            placeholder="Search name, email, username…"
            className="field"
            style={{ flex: 1, margin: 0 }}
          />
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <button className="button secondary sm" type="submit">Search</button>
        </form>
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/users?status=${opt.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className={`button ${status === opt.value ? "accent" : "secondary"} sm`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center" }}>
          <p className="muted">No users found.</p>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="adminTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email / Username</th>
                <th>Org</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Signed up</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.full_name ?? "—"}</td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    <div>{user.email ?? "—"}</div>
                    {user.username && <div style={{ color: "var(--accent)" }}>@{user.username}</div>}
                  </td>
                  <td>
                    {user.org_id ? (
                      <Link href={`/admin/orgs/${user.org_id}`} className="textLink">
                        {user.org_name ?? user.org_id}
                      </Link>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {user.plan_key ? (
                      <span className="badge neutral">{user.plan_key}</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                    {user.subscription_status && (
                      <span
                        className={`badge ${user.subscription_status === "active" ? "success" : "warning"}`}
                        style={{ marginLeft: 4 }}
                      >
                        {user.subscription_status}
                      </span>
                    )}
                  </td>
                  <td>
                    {user.suspended_at ? (
                      <span className="badge danger">Suspended</span>
                    ) : (
                      <span className="badge success">Active</span>
                    )}
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <Link href={`/admin/users/${user.id}`} className="button secondary sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: "center" }}>
          {currentPage > 1 && (
            <Link
              href={`/admin/users?page=${currentPage - 1}&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className="button secondary sm"
            >
              ← Prev
            </Link>
          )}
          <span className="muted" style={{ lineHeight: "32px", fontSize: 13 }}>
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/admin/users?page=${currentPage + 1}&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className="button secondary sm"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

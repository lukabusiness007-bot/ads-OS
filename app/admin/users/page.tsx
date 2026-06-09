import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { listUsers } from "@/lib/admin/data";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterControls, type FilterTab } from "@/components/admin/FilterControls";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { PaginationControls } from "@/components/admin/PaginationControls";

type UserRow = Awaited<ReturnType<typeof listUsers>>["rows"][number];

const STATUS_TABS: FilterTab[] = [
  { value: "all",       label: "All users" },
  { value: "active",    label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const COLUMNS: DataTableColumn<UserRow>[] = [
  {
    key: "name",
    header: "Name",
    cell: (user) => <span style={{ fontWeight: 600 }}>{user.full_name ?? "—"}</span>
  },
  {
    key: "contact",
    header: "Email / Username",
    cell: (user) => (
      <div className="muted" style={{ fontSize: 12 }}>
        <div>{user.email ?? "—"}</div>
        {user.username && <div style={{ color: "var(--accent)" }}>@{user.username}</div>}
      </div>
    )
  },
  {
    key: "org",
    header: "Org",
    cell: (user) =>
      user.org_id ? (
        <Link href={`/admin/orgs/${user.org_id}`} className="textLink">
          {user.org_name ?? user.org_id}
        </Link>
      ) : (
        <span className="muted">—</span>
      )
  },
  {
    key: "plan",
    header: "Plan",
    cell: (user) => (
      <>
        {user.plan_key ? <span className="badge neutral">{user.plan_key}</span> : <span className="muted">—</span>}
        {user.subscription_status && (
          <span
            className={`badge ${user.subscription_status === "active" ? "success" : "warning"}`}
            style={{ marginLeft: 4 }}
          >
            {user.subscription_status}
          </span>
        )}
      </>
    )
  },
  {
    key: "status",
    header: "Status",
    cell: (user) =>
      user.suspended_at ? <span className="badge danger">Suspended</span> : <span className="badge success">Active</span>
  },
  {
    key: "signed_up",
    header: "Signed up",
    cell: (user) => <span className="muted" style={{ fontSize: 12 }}>{new Date(user.created_at).toLocaleDateString()}</span>
  },
  {
    key: "actions",
    header: "",
    align: "end",
    cell: (user) => (
      <Link href={`/admin/users/${user.id}`} className="button secondary sm">
        View →
      </Link>
    )
  }
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

  const emptyState = search.trim() ? (
    <>
      <strong>No matches for &ldquo;{search}&rdquo;</strong>
      <p className="muted">Try a different name, email, or username, or clear the search.</p>
    </>
  ) : (
    <>
      <strong>No users in this view</strong>
      <p className="muted">Merchants will appear here as soon as they sign up.</p>
    </>
  );

  return (
    <>
      <PageHeader eyebrow="Admin" title="Users" subtitle={`${total.toLocaleString()} total merchants`} />

      <FilterControls
        tabs={STATUS_TABS}
        tabParam="status"
        search
        searchParam="search"
        searchPlaceholder="Search name, email, username…"
      />

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <DataTable rows={rows} columns={COLUMNS} getRowKey={(user) => user.id} empty={emptyState} />
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hrefForPage={(p) => `/admin/users?page=${p}&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
      />
    </>
  );
}

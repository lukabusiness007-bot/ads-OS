import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { listOrganizations } from "@/lib/admin/data";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterControls } from "@/components/admin/FilterControls";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";

type OrgRow = Awaited<ReturnType<typeof listOrganizations>>["rows"][number];

const COLUMNS: DataTableColumn<OrgRow>[] = [
  {
    key: "name",
    header: "Name",
    cell: (org) => <span style={{ fontWeight: 600 }}>{org.name}</span>
  },
  {
    key: "slug",
    header: "Slug",
    cell: (org) => <span className="muted" style={{ fontSize: 12 }}>{org.slug}</span>
  },
  {
    key: "plan",
    header: "Plan",
    cell: (org) => <span className="badge neutral">{org.plan_key}</span>
  },
  {
    key: "members",
    header: "Members",
    cell: (org) => <span className="muted">{org.member_count}</span>
  },
  {
    key: "products",
    header: "Products",
    cell: (org) => <span className="muted">{org.product_count}</span>
  },
  {
    key: "status",
    header: "Status",
    cell: (org) =>
      org.suspended_at ? <span className="badge danger">Suspended</span> : <span className="badge success">Active</span>
  },
  {
    key: "created",
    header: "Created",
    cell: (org) => <span className="muted" style={{ fontSize: 12 }}>{new Date(org.created_at).toLocaleDateString()}</span>
  },
  {
    key: "actions",
    header: "",
    align: "end",
    cell: (org) => (
      <Link href={`/admin/orgs/${org.id}`} className="button secondary sm">
        View →
      </Link>
    )
  }
];

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

  const emptyState = search.trim() ? (
    <>
      <strong>No matches for &ldquo;{search}&rdquo;</strong>
      <p className="muted">Try a different organization name, or clear the search.</p>
    </>
  ) : (
    <>
      <strong>No organizations yet</strong>
      <p className="muted">Organizations appear here as soon as a merchant signs up.</p>
    </>
  );

  return (
    <>
      <PageHeader eyebrow="Admin" title="Organizations" subtitle={`${total.toLocaleString()} total orgs`} />

      <FilterControls search searchParam="search" searchPlaceholder="Search org name…" />

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <DataTable rows={rows} columns={COLUMNS} getRowKey={(org) => org.id} empty={emptyState} />
      </div>

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

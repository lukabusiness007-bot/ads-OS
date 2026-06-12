import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getUserDetail } from "@/lib/admin/data";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { SuspendButton } from "./SuspendButton";
import { ImpersonateButton } from "./ImpersonateButton";
import { AdminRoleButton } from "./AdminRoleButton";
import type { ProductStatus } from "@/lib/types";

type UserDetail = Awaited<ReturnType<typeof getUserDetail>>;
type OrgRow = UserDetail["orgs"][number];
type ProductRow = UserDetail["products"][number];
type AuditRow = UserDetail["recentAudit"][number];

const ORG_COLUMNS: DataTableColumn<OrgRow>[] = [
  {
    key: "name",
    header: "Organization",
    cell: (org) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className="row" style={{ justifyContent: "flex-start", gap: 8 }}>
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
    )
  }
];

const AUDIT_COLUMNS: DataTableColumn<AuditRow>[] = [
  {
    key: "action",
    header: "Action",
    cell: (entry) => <span className="badge neutral">{entry.action}</span>
  },
  {
    key: "actor",
    header: "Actor",
    cell: (entry) => (
      <span className="muted" style={{ fontSize: 12 }}>
        {entry.actor?.full_name ?? entry.actor?.email ?? entry.actor_id ?? "system"}
      </span>
    )
  },
  {
    key: "when",
    header: "When",
    cell: (entry) => <span className="muted" style={{ fontSize: 12 }}>{new Date(entry.created_at).toLocaleString()}</span>
  }
];

const PRODUCT_COLUMNS: DataTableColumn<ProductRow>[] = [
  {
    key: "name",
    header: "Name",
    cell: (product) => <span style={{ fontWeight: 600 }}>{product.name}</span>
  },
  {
    key: "status",
    header: "Status",
    cell: (product) => <StatusBadge status={product.status as ProductStatus} />
  },
  {
    key: "updated",
    header: "Updated",
    cell: (product) => <span className="muted" style={{ fontSize: 12 }}>{new Date(product.updated_at).toLocaleDateString()}</span>
  },
  {
    key: "actions",
    header: "",
    align: "end",
    cell: (product) =>
      product.status === "awaiting_review" || product.status === "generation_failed" ? (
        <Link href={`/admin/review/${product.id}`} className="button accent sm">
          Review →
        </Link>
      ) : null
  }
];

export default async function AdminUserDetailPage({
  params
}: {
  params: Promise<{ userId: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/users");
  if (!admin) return null;

  const { userId } = await params;

  let detail: UserDetail | null = null;
  try {
    detail = await getUserDetail(admin, userId);
  } catch {
    return (
      <>
        <PageHeader eyebrow="Admin" title="User not found" subtitle={<Link href="/admin/users" className="textLink">← Back to users</Link>} />
      </>
    );
  }

  const { profile, orgs, products, recentAudit } = detail;
  const displayName = profile.full_name ?? profile.email ?? "User";

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title={displayName}
        subtitle={
          <>
            <Link href="/admin/users" className="textLink" style={{ fontSize: 13 }}>← Back to users</Link>
            <br />
            {profile.email}
            {profile.username && <> · @{profile.username}</>}
            {" · "}Joined {new Date(profile.created_at).toLocaleDateString()}
          </>
        }
        action={
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {profile.suspended_at ? (
              <span className="badge danger">Suspended</span>
            ) : (
              <span className="badge success">Active</span>
            )}
            <SuspendButton userId={userId} suspended={!!profile.suspended_at} />
            <ImpersonateButton userId={userId} userName={displayName} />
            <AdminRoleButton userId={userId} isAdmin={profile.is_platform_admin} isSelf={profile.id === admin.id} />
          </div>
        }
      />

      <div className="grid two" style={{ gap: 20, alignItems: "start" }}>
        {/* Left col */}
        <div className="stack">
          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Organizations</h2>
            <DataTable
              rows={orgs}
              columns={ORG_COLUMNS}
              getRowKey={(org) => org.id}
              empty={<p className="muted">No orgs found.</p>}
            />
          </div>

          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Recent audit activity</h2>
            <DataTable
              rows={recentAudit}
              columns={AUDIT_COLUMNS}
              getRowKey={(entry) => entry.id}
              empty={<p className="muted">No audit events.</p>}
            />
          </div>
        </div>

        {/* Right col: products */}
        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Products ({products.length})</h2>
          <DataTable
            rows={products}
            columns={PRODUCT_COLUMNS}
            getRowKey={(product) => product.id}
            empty={<p className="muted">No products.</p>}
          />
        </div>
      </div>
    </>
  );
}

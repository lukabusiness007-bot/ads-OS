import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getOrganizationDetail } from "@/lib/admin/data";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { OrgSuspendButton } from "./OrgSuspendButton";
import type { ProductStatus } from "@/lib/types";

type OrgDetail = Awaited<ReturnType<typeof getOrganizationDetail>>;
type MemberRow = OrgDetail["members"][number];
type ProductRow = OrgDetail["products"][number];
type AuditRow = OrgDetail["recentAudit"][number];

const MEMBER_COLUMNS: DataTableColumn<MemberRow>[] = [
  {
    key: "name",
    header: "Name",
    cell: (member) => (
      <span style={{ fontWeight: 600 }}>{member.profile?.full_name ?? member.profile?.email ?? member.user_id}</span>
    )
  },
  {
    key: "role",
    header: "Role",
    cell: (member) => <span className="badge neutral">{member.role}</span>
  },
  {
    key: "status",
    header: "Status",
    cell: (member) =>
      member.profile?.suspended_at ? <span className="badge danger">Suspended</span> : <span className="badge success">Active</span>
  },
  {
    key: "actions",
    header: "",
    align: "end",
    cell: (member) => (
      <Link href={`/admin/users/${member.user_id}`} className="button secondary sm">
        View →
      </Link>
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

export default async function AdminOrgDetailPage({
  params
}: {
  params: Promise<{ orgId: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/orgs");
  if (!admin) return null;

  const { orgId } = await params;

  let detail: OrgDetail | null = null;
  try {
    detail = await getOrganizationDetail(admin, orgId);
  } catch {
    return (
      <>
        <PageHeader eyebrow="Admin" title="Organization not found" subtitle={<Link href="/admin/orgs" className="textLink">← Back to orgs</Link>} />
      </>
    );
  }

  const { org, members, subscription, products, recentAudit } = detail;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title={org.name}
        subtitle={
          <>
            <Link href="/admin/orgs" className="textLink" style={{ fontSize: 13 }}>← Back to orgs</Link>
            <br />
            slug: {org.slug}
            {org.website && <> · <a href={org.website} target="_blank" rel="noreferrer" className="textLink">{org.website}</a></>}
            {" · "}Created {new Date(org.created_at).toLocaleDateString()}
          </>
        }
        action={
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {org.suspended_at ? (
              <span className="badge danger">Suspended</span>
            ) : (
              <span className="badge success">Active</span>
            )}
            <OrgSuspendButton orgId={org.id} suspended={!!org.suspended_at} />
          </div>
        }
      />

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
            <DataTable
              rows={members}
              columns={MEMBER_COLUMNS}
              getRowKey={(member) => member.user_id}
              empty={<p className="muted">No members.</p>}
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

        {/* Right: products */}
        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Products ({products.length})</h2>
          <DataTable
            rows={products}
            columns={PRODUCT_COLUMNS}
            getRowKey={(product) => product.id}
            empty={<p className="muted">No products yet.</p>}
          />
        </div>
      </div>
    </>
  );
}

import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { listAuditActors, listAuditLog, type AdminAuditEntryWithTarget } from "@/lib/admin/data";
import { PageHeader } from "@/components/admin/PageHeader";
import { AuditFilters, type AuditFilterOption } from "@/components/admin/AuditFilters";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { PaginationControls } from "@/components/admin/PaginationControls";
import Link from "next/link";

const PAGE_SIZE = 50;

const ACTION_OPTIONS: AuditFilterOption[] = [
  { value: "",            label: "All actions" },
  { value: "approve",     label: "Approve" },
  { value: "reject",      label: "Reject" },
  { value: "regenerate",  label: "Regenerate" },
  { value: "suspend",     label: "Suspend" },
  { value: "unsuspend",   label: "Unsuspend" },
  { value: "impersonate_start", label: "Impersonate start" },
  { value: "impersonate_stop",  label: "Impersonate stop" },
  { value: "edit_product",      label: "Edit product" },
  { value: "edit_plan",         label: "Edit plan" },
  { value: "edit_config",       label: "Edit settings" },
  { value: "grant_admin",       label: "Grant admin" },
  { value: "revoke_admin",      label: "Revoke admin" },
];

const TARGET_OPTIONS: AuditFilterOption[] = [
  { value: "",             label: "All targets" },
  { value: "product",      label: "Products" },
  { value: "user",         label: "Users" },
  { value: "organization", label: "Organizations" },
  { value: "config",       label: "Settings" },
];

const ACTION_VERBS: Record<string, string> = {
  approve: "approved",
  reject: "rejected",
  regenerate: "requested a regeneration of",
  suspend: "suspended",
  unsuspend: "unsuspended",
  impersonate_start: "started impersonating",
  impersonate_stop: "stopped impersonating",
  edit_product: "edited",
  edit_plan: "changed the plan for",
  edit_config: "updated",
  grant_admin: "granted platform admin to",
  revoke_admin: "revoked platform admin from",
};

const TARGET_NOUNS: Record<string, string> = {
  product: "product",
  user: "user",
  organization: "organization",
  config: "the platform settings",
};

const ACTION_BADGE: Record<string, "danger" | "success" | "neutral"> = {
  reject: "danger",
  suspend: "danger",
  impersonate_start: "danger",
  approve: "success",
  unsuspend: "success",
};

export default async function AdminAuditPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string; targetType?: string; actor?: string; from?: string; to?: string; page?: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/audit");
  if (!admin) return null;

  const { action = "", targetType = "", actor = "", from = "", to = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  const [{ rows, total }, actors] = await Promise.all([
    listAuditLog(admin, {
      action: action || undefined,
      targetType: targetType || undefined,
      actorId: actor || undefined,
      dateFrom: from || undefined,
      dateTo: to || undefined,
      page: currentPage,
      pageSize: PAGE_SIZE
    }),
    listAuditActors(admin)
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const actorOptions: AuditFilterOption[] = [
    { value: "", label: "All actors" },
    ...actors.map((a) => ({ value: a.id, label: a.full_name ?? a.username ?? a.email ?? a.id }))
  ];

  const hasFilters = Boolean(action || targetType || actor || from || to);

  function targetLink(entry: AdminAuditEntryWithTarget) {
    if (!entry.target_id) return null;
    if (entry.target_type === "product") return `/admin/review/${entry.target_id}`;
    if (entry.target_type === "user") return `/admin/users/${entry.target_id}`;
    if (entry.target_type === "organization") return `/admin/orgs/${entry.target_id}`;
    return null;
  }

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (targetType) params.set("targetType", targetType);
    if (actor) params.set("actor", actor);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(targetPage));
    return `/admin/audit?${params.toString()}`;
  }

  const COLUMNS: DataTableColumn<AdminAuditEntryWithTarget>[] = [
    {
      key: "entry",
      header: "Entry",
      cell: (entry) => (
        <div className="stack" style={{ gap: 4 }}>
          <p style={{ margin: 0 }}>
            <strong>{actorLabel(entry)}</strong>{" "}
            {ACTION_VERBS[entry.action] ?? entry.action}{" "}
            {entry.target_type && (
              <>
                {TARGET_NOUNS[entry.target_type] ?? entry.target_type}{" "}
                {entry.target_name ? (
                  targetLink(entry) ? (
                    <Link href={targetLink(entry)!} className="textLink">
                      <strong>{entry.target_name}</strong>
                    </Link>
                  ) : (
                    <strong>{entry.target_name}</strong>
                  )
                ) : entry.target_id ? (
                  <span className="muted">{entry.target_id.slice(0, 8)}…</span>
                ) : null}
              </>
            )}
            <span className="muted"> · {formatRelativeTime(entry.created_at)}</span>
          </p>
          <p className="muted" style={{ margin: 0, fontSize: 12 }} title={new Date(entry.created_at).toLocaleString()}>
            <span className={`badge ${ACTION_BADGE[entry.action] ?? "neutral"}`}>{entry.action}</span>
            {" "}
            {new Date(entry.created_at).toLocaleString()}
          </p>
          {Object.keys(entry.metadata ?? {}).length > 0 && (
            <details>
              <summary className="textLink" style={{ cursor: "pointer", fontSize: 12 }}>Details</summary>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12 }} className="muted">
                {Object.entries(entry.metadata)
                  .filter(([key]) => key !== "token")
                  .map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      )
    }
  ];

  const emptyState = hasFilters ? (
    <>
      <strong>No entries match these filters</strong>
      <p className="muted">Try widening the date range or clearing a filter.</p>
    </>
  ) : (
    <>
      <strong>No audit entries yet</strong>
      <p className="muted">Admin actions — approvals, suspensions, plan changes — will show up here.</p>
    </>
  );

  return (
    <>
      <PageHeader eyebrow="Admin" title="Audit log" subtitle={`${total.toLocaleString()} total entries`} />

      <AuditFilters actionOptions={ACTION_OPTIONS} targetOptions={TARGET_OPTIONS} actorOptions={actorOptions} />

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <DataTable rows={rows} columns={COLUMNS} getRowKey={(entry) => entry.id} empty={emptyState} />
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hrefForPage={pageHref}
      />
    </>
  );
}

function actorLabel(entry: AdminAuditEntryWithTarget): string {
  return entry.actor?.full_name ?? entry.actor?.username ?? entry.actor?.email ?? entry.actor_id ?? "System";
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  if (diffSeconds < 60) return "just now";

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.round(diffDays / 365);
  return `${diffYears}y ago`;
}

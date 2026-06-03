import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { listAuditLog } from "@/lib/admin/data";

const ACTION_OPTIONS = [
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
];

const TARGET_OPTIONS = [
  { value: "",             label: "All targets" },
  { value: "product",      label: "Products" },
  { value: "user",         label: "Users" },
  { value: "organization", label: "Organizations" },
];

export default async function AdminAuditPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string; targetType?: string; page?: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/audit");
  if (!admin) return null;

  const { action = "", targetType = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  const { rows, total } = await listAuditLog(admin, {
    action: action || undefined,
    targetType: targetType || undefined,
    page: currentPage,
    pageSize: 50
  });

  const totalPages = Math.ceil(total / 50);

  function targetLink(entry: (typeof rows)[number]) {
    if (!entry.target_id) return null;
    if (entry.target_type === "product") return `/admin/review/${entry.target_id}`;
    if (entry.target_type === "user") return `/admin/users/${entry.target_id}`;
    if (entry.target_type === "organization") return `/admin/orgs/${entry.target_id}`;
    return null;
  }

  function actionBadge(action: string) {
    const danger = ["reject", "suspend", "impersonate_start"];
    const success = ["approve", "unsuspend"];
    if (danger.includes(action)) return "danger";
    if (success.includes(action)) return "success";
    return "neutral";
  }

  return (
    <>
      <header>
        <p className="eyebrow">Admin</p>
        <h1>Audit Log</h1>
        <p className="muted">{total.toLocaleString()} total entries</p>
      </header>

      {/* Filters */}
      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {ACTION_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/audit?action=${opt.value}&targetType=${targetType}&page=1`}
            className={`button ${action === opt.value ? "accent" : "secondary"} sm`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
      <div className="row" style={{ gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TARGET_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/audit?action=${action}&targetType=${opt.value}&page=1`}
            className={`button ${targetType === opt.value ? "accent" : "secondary"} sm`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center" }}>
          <p className="muted">No audit entries found.</p>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="adminTable">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => {
                const link = targetLink(entry);
                return (
                  <tr key={entry.id}>
                    <td className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {entry.actor?.full_name ?? entry.actor?.username ?? entry.actor?.email ?? entry.actor_id ?? "system"}
                    </td>
                    <td>
                      <span className={`badge ${actionBadge(entry.action)}`}>{entry.action}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {link ? (
                        <Link href={link} className="textLink">
                          {entry.target_type}/{entry.target_id?.slice(0, 8)}…
                        </Link>
                      ) : (
                        <span className="muted">{entry.target_type ?? "—"}</span>
                      )}
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {entry.metadata?.notes
                        ? String(entry.metadata.notes)
                        : entry.metadata && Object.keys(entry.metadata).length > 0
                        ? Object.entries(entry.metadata)
                            .filter(([k]) => k !== "token")
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: "center" }}>
          {currentPage > 1 && (
            <Link href={`/admin/audit?action=${action}&targetType=${targetType}&page=${currentPage - 1}`} className="button secondary sm">
              ← Prev
            </Link>
          )}
          <span className="muted" style={{ lineHeight: "32px", fontSize: 13 }}>
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={`/admin/audit?action=${action}&targetType=${targetType}&page=${currentPage + 1}`} className="button secondary sm">
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

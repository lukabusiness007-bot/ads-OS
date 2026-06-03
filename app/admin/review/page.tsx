import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getReviewQueue } from "@/lib/admin/data";
import { StatusBadge } from "@/components/StatusBadge";
import type { ProductStatus } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "awaiting_review", label: "Awaiting review" },
  { value: "approved",        label: "Approved" },
  { value: "rejected",        label: "Rejected" },
  { value: "generation_failed", label: "Failed" },
];

export default async function AdminReviewQueuePage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/review");
  if (!admin) return null;

  const { status = "awaiting_review" } = await searchParams;
  const queue = await getReviewQueue(admin, { statusFilter: status });

  return (
    <>
      <header>
        <p className="eyebrow">Admin</p>
        <h1>Review Queue</h1>
        <p className="muted">Inspect generated 3D models and approve, reject, or request regeneration.</p>
      </header>

      {/* Status filter tabs */}
      <div className="row" style={{ gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/review?status=${opt.value}`}
            className={`button ${status === opt.value ? "accent" : "secondary"} sm`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {queue.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center" }}>
          <p className="muted">No products with status &ldquo;{status}&rdquo;.</p>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="adminTable">
            <thead>
              <tr>
                <th>Product</th>
                <th>Merchant</th>
                <th>Status</th>
                <th>Photos</th>
                <th>Model</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {queue.map(({ product, org, model_asset, photos }) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 600 }}>{product.name}</td>
                  <td>
                    <Link href={`/admin/orgs/${org.id}`} className="textLink">
                      {org.name}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={product.status as ProductStatus} />
                  </td>
                  <td className="muted">{photos.length}</td>
                  <td>
                    {model_asset?.public_glb_url ? (
                      <span className="badge success">GLB ready</span>
                    ) : (
                      <span className="badge neutral">No model</span>
                    )}
                  </td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {new Date(product.updated_at).toLocaleString()}
                  </td>
                  <td>
                    <Link href={`/admin/review/${product.id}`} className="button accent sm">
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

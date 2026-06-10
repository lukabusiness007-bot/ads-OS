import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getProductForReview } from "@/lib/admin/data";
import { StatusBadge } from "@/components/StatusBadge";
import { ModelViewer } from "@/components/ModelViewer";
import { ReviewActions } from "./ReviewActions";
import type { ProductStatus } from "@/lib/types";

export default async function ReviewInspectorPage({
  params
}: {
  params: Promise<{ productId: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/review");
  if (!admin) return null;

  const { productId } = await params;

  let item: Awaited<ReturnType<typeof getProductForReview>> | null = null;
  try {
    item = await getProductForReview(admin, productId);
  } catch {
    return (
      <>
        <header>
          <Link href="/admin/review" className="textLink">← Back to queue</Link>
          <h1>Product not found</h1>
        </header>
        <div className="panel">
          <p className="muted">This product does not exist or has been removed.</p>
        </div>
      </>
    );
  }

  const { product, org, review, model_asset, modelAssetForViewer, latest_job, modelChecks, photoPresignedUrls } = item;

  const dimensions = (product.width_m || product.height_m || product.depth_m)
    ? `${Math.round((product.width_m ?? 0) * 100)} × ${Math.round((product.height_m ?? 0) * 100)} × ${Math.round((product.depth_m ?? 0) * 100)} cm`
    : "Not specified";

  return (
    <>
      <header>
        <div className="row" style={{ alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Link href="/admin/review" className="textLink" style={{ fontSize: 13 }}>
              ← Back to queue
            </Link>
            <h1 style={{ marginTop: 4 }}>{product.name}</h1>
            <p className="muted">
              <Link href={`/admin/orgs/${org.id}`} className="textLink">{org.name}</Link>
              {" · "}
              <span>{product.category}</span>
              {" · "}
              <span>Updated {new Date(product.updated_at).toLocaleString()}</span>
            </p>
          </div>
          <StatusBadge status={product.status as ProductStatus} />
        </div>
      </header>

      <div className="inspectorGrid">
        {/* Left: 3D viewer */}
        <div className="stack">
          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Generated model</h2>
            <ModelViewer asset={modelAssetForViewer} alt={`3D model of ${product.name}`} arShareUrl={null} arPreviewProductId={product.id} />
            {model_asset && (
              <div className="row" style={{ flexWrap: "wrap", gap: 8, fontSize: 13 }}>
                <span className="badge neutral">{model_asset.file_size_mb?.toFixed(1) ?? "?"} MB</span>
                <span className="badge neutral">{model_asset.triangle_count.toLocaleString()} triangles</span>
                <span className="badge neutral">{model_asset.texture_max}px texture</span>
              </div>
            )}
          </div>

          {/* Model package checks */}
          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Automated checks</h2>
            {modelChecks.length === 0 ? (
              <p className="muted">No model asset — checks unavailable.</p>
            ) : (
              <div>
                {modelChecks.map((check) => (
                  <div key={check.id} className="checkRow">
                    <span
                      className={
                        check.status === "pass" ? "checkDotPass"
                        : check.status === "warning" ? "checkDotWarn"
                        : "checkDotFail"
                      }
                    />
                    <div>
                      <strong style={{ fontSize: 13 }}>{check.label}</strong>
                      <p className="muted" style={{ margin: 0, fontSize: 12 }}>{check.detail}</p>
                    </div>
                    <span
                      className={`badge ${check.status === "pass" ? "success" : check.status === "warning" ? "warning" : "danger"}`}
                      style={{ marginLeft: "auto", flexShrink: 0 }}
                    >
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: photos, metadata, actions */}
        <div className="stack">
          {/* Product photos */}
          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Merchant photos ({photoPresignedUrls.length})</h2>
            {photoPresignedUrls.length === 0 ? (
              <p className="muted">No photos uploaded.</p>
            ) : (
              <div className="photoStrip">
                {photoPresignedUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Product photo ${i + 1}`}
                    className="photoThumb"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product metadata */}
          <div className="panel stack">
            <h2 style={{ margin: 0 }}>Product info</h2>
            <table style={{ fontSize: 13, borderCollapse: "collapse", width: "100%" }}>
              <tbody>
                <tr>
                  <td className="muted" style={{ padding: "4px 8px 4px 0", width: 120 }}>Dimensions</td>
                  <td style={{ padding: "4px 0" }}>{dimensions}</td>
                </tr>
                <tr>
                  <td className="muted" style={{ padding: "4px 8px 4px 0" }}>Category</td>
                  <td style={{ padding: "4px 0" }}>{product.category}</td>
                </tr>
                {product.customer_url && (
                  <tr>
                    <td className="muted" style={{ padding: "4px 8px 4px 0" }}>Store URL</td>
                    <td style={{ padding: "4px 0" }}>
                      <a href={product.customer_url} target="_blank" rel="noreferrer" className="textLink">
                        {product.customer_url}
                      </a>
                    </td>
                  </tr>
                )}
                {product.description && (
                  <tr>
                    <td className="muted" style={{ padding: "4px 8px 4px 0" }}>Description</td>
                    <td style={{ padding: "4px 0" }}>{product.description}</td>
                  </tr>
                )}
                {latest_job && (
                  <tr>
                    <td className="muted" style={{ padding: "4px 8px 4px 0" }}>Gen job</td>
                    <td style={{ padding: "4px 0" }}>
                      <span className={`badge ${latest_job.status === "succeeded" ? "success" : latest_job.status === "failed" ? "danger" : "warning"}`}>
                        {latest_job.provider} · {latest_job.status}
                      </span>
                      {latest_job.error_message && (
                        <p className="muted" style={{ margin: "2px 0 0", fontSize: 12 }}>{latest_job.error_message}</p>
                      )}
                    </td>
                  </tr>
                )}
                {review && (
                  <tr>
                    <td className="muted" style={{ padding: "4px 8px 4px 0" }}>Last review</td>
                    <td style={{ padding: "4px 0" }}>
                      <span className={`badge ${review.status === "approved" ? "success" : review.status === "rejected" ? "danger" : "warning"}`}>
                        {review.status}
                      </span>
                      {review.notes && (
                        <p className="muted" style={{ margin: "2px 0 0", fontSize: 12 }}>{review.notes}</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Decision actions — client component */}
          <ReviewActions
            productId={product.id}
            productName={product.name}
            currentStatus={product.status as ProductStatus}
            modelChecks={modelChecks}
          />
        </div>
      </div>
    </>
  );
}

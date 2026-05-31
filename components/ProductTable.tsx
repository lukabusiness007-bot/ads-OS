"use client"

import { products } from "@/lib/mock-data";
import { CopyButton } from "./CopyButton";
import { StatusBadge } from "./StatusBadge";
import { useLang } from "@/lib/lang";

export function ProductTable() {
  const { tr } = useLang()
  const tb = tr.table

  return (
    <div className="responsiveTable">
      <table className="table actionTable">
        <thead>
          <tr>
            <th>{tb.product}</th>
            <th>{tb.status}</th>
            <th>{tb.nextAction}</th>
            <th>{tb.hostedLink}</th>
            <th>{tb.arClicks}</th>
            <th>{tb.storeClicks}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td data-label={tb.product}>
                <strong>{product.name}</strong>
                <p className="muted">{product.category.replace("_", " ")} / {product.photoCount} {tb.photos}</p>
              </td>
              <td data-label={tb.status}>
                <StatusBadge status={product.status} />
              </td>
              <td data-label={tb.nextAction}>{nextAction(product.status, product.requiredAnglesComplete, tb)}</td>
              <td data-label={tb.hostedLink}>
                {product.hostedPage?.status === "published" ? (
                  <CopyButton value={product.hostedPage.publicUrl} label={tb.copyLink} />
                ) : (
                  <span className="muted">{tb.notLive}</span>
                )}
              </td>
              <td data-label={tb.arClicks}>{product.analytics?.arButtonClicks ?? 0}</td>
              <td data-label={tb.storeClicks}>{product.analytics?.ctaClicks ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function nextAction(
  status: (typeof products)[number]["status"],
  requiredAnglesComplete: boolean,
  tb: { addPhotos: string; waitingModel: string; reviewPreview: string; publishLink: string; viewAnalytics: string; reviewDetails: string }
) {
  if (status === "draft" || !requiredAnglesComplete) return tb.addPhotos
  if (status === "generating") return tb.waitingModel
  if (status === "awaiting_review") return tb.reviewPreview
  if (status === "approved") return tb.publishLink
  if (status === "published") return tb.viewAnalytics
  return tb.reviewDetails
}

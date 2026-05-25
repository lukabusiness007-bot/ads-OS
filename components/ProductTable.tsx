import { products } from "@/lib/mock-data";
import { CopyButton } from "./CopyButton";
import { StatusBadge } from "./StatusBadge";

export function ProductTable() {
  return (
    <div className="responsiveTable">
      <table className="table actionTable">
        <thead>
          <tr>
            <th>Product</th>
            <th>Status</th>
            <th>Next action</th>
            <th>Hosted link</th>
            <th>AR clicks</th>
            <th>Store clicks</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td data-label="Product">
                <strong>{product.name}</strong>
                <p className="muted">{product.category.replace("_", " ")} / {product.photoCount} photos</p>
              </td>
              <td data-label="Status">
                <StatusBadge status={product.status} />
              </td>
              <td data-label="Next action">{nextAction(product.status, product.requiredAnglesComplete)}</td>
              <td data-label="Hosted link">
                {product.hostedPage?.status === "published" ? (
                  <CopyButton value={product.hostedPage.publicUrl} label="Copy hosted link" />
                ) : (
                  <span className="muted">Not live yet</span>
                )}
              </td>
              <td data-label="AR clicks">{product.analytics?.arButtonClicks ?? 0}</td>
              <td data-label="Store clicks">{product.analytics?.ctaClicks ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function nextAction(status: (typeof products)[number]["status"], requiredAnglesComplete: boolean) {
  if (status === "draft" || !requiredAnglesComplete) {
    return "Add photos";
  }

  if (status === "generating") {
    return "Waiting for model";
  }

  if (status === "awaiting_review") {
    return "Review preview";
  }

  if (status === "approved") {
    return "Publish link";
  }

  if (status === "published") {
    return "View analytics";
  }

  return "Review details";
}

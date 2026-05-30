import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/mock-data";

function sumMetric(metric: "pageViews" | "viewerInteractions" | "arButtonClicks" | "ctaClicks") {
  return products.reduce((sum, p) => sum + (p.analytics?.[metric] ?? 0), 0);
}

export default function AnalyticsPage() {
  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Shopper engagement</h1>
          <p className="muted">
            Page views, 3D viewer interactions, AR clicks, and store CTA clicks — by product.
          </p>
        </div>
        <Link className="button secondary" href="/billing">
          View billing
        </Link>
      </header>

      {/* Summary KPIs */}
      <section className="grid four">
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Page views
          </span>
          <strong>{sumMetric("pageViews")}</strong>
          <span className="badge neutral">All products</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Viewer interactions
          </span>
          <strong>{sumMetric("viewerInteractions")}</strong>
          <span className="badge neutral">3D engagements</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            AR clicks
          </span>
          <strong>{sumMetric("arButtonClicks")}</strong>
          <span className="badge neutral">View in room</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Store CTA clicks
          </span>
          <strong>{sumMetric("ctaClicks")}</strong>
          <span className="badge success">Back to store</span>
        </article>
      </section>

      {/* Per-product table */}
      <section className="panel">
        <div style={{ marginBottom: 16 }}>
          <h2>Product breakdown</h2>
          <p className="muted">Engagement metrics for each published product page.</p>
        </div>
        <div className="responsiveTable">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Page views</th>
                <th>Interactions</th>
                <th>AR clicks</th>
                <th>Store clicks</th>
                <th>Top devices</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td data-label="Product">
                    <strong>{product.name}</strong>
                    <p className="muted" style={{ marginBottom: 0, fontSize: 13 }}>
                      {product.category.replace("_", " ")}
                    </p>
                  </td>
                  <td data-label="Page views">{product.analytics?.pageViews ?? 0}</td>
                  <td data-label="Interactions">{product.analytics?.viewerInteractions ?? 0}</td>
                  <td data-label="AR clicks">{product.analytics?.arButtonClicks ?? 0}</td>
                  <td data-label="Store clicks">{product.analytics?.ctaClicks ?? 0}</td>
                  <td data-label="Top devices">
                    {product.analytics?.topDevices.length
                      ? product.analytics.topDevices.map((d) => `${d.type} ${d.share}%`).join(", ")
                      : <span className="muted">No data yet</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

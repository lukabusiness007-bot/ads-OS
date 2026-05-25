import { AppShell } from "@/components/AppShell";
import { pricingPackages, products } from "@/lib/mock-data";

export default function AnalyticsBillingPage() {
  return (
    <AppShell>
      <header>
        <p className="eyebrow">Analytics/Billing</p>
        <h1>Prove engagement and keep pilot costs predictable</h1>
        <p className="muted">
          Track page views, viewer interactions, AR clicks, store CTA clicks, device mix, and current plan usage.
        </p>
      </header>

      <section className="grid four">
        <article className="card metric">
          <span className="muted">Page views</span>
          <strong>{sumMetric("pageViews")}</strong>
        </article>
        <article className="card metric">
          <span className="muted">Viewer interactions</span>
          <strong>{sumMetric("viewerInteractions")}</strong>
        </article>
        <article className="card metric">
          <span className="muted">AR clicks</span>
          <strong>{sumMetric("arButtonClicks")}</strong>
        </article>
        <article className="card metric">
          <span className="muted">Store CTA clicks</span>
          <strong>{sumMetric("ctaClicks")}</strong>
        </article>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>Product analytics</h2>
          <div className="responsiveTable">
            <table className="table compact">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Views</th>
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
                    </td>
                    <td data-label="Views">{product.analytics?.pageViews ?? 0}</td>
                    <td data-label="Interactions">{product.analytics?.viewerInteractions ?? 0}</td>
                    <td data-label="AR clicks">{product.analytics?.arButtonClicks ?? 0}</td>
                    <td data-label="Store clicks">{product.analytics?.ctaClicks ?? 0}</td>
                    <td data-label="Top devices">
                      {product.analytics?.topDevices.map((device) => `${device.type} ${device.share}%`).join(", ") ?? "No data yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel stack">
          <h2>Pilot billing</h2>
          <p className="muted">
            Published-page subscription plus a per-approved-model fee. Revision or regeneration only appears when a new
            version is requested after an acceptable verified model exists.
          </p>
          {pricingPackages.slice(0, 3).map((item) => (
            <div className="lineItem" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p className="muted">{item.billingUnit}</p>
              </div>
              <span className="pricePill">{item.priceRangeEur}</span>
            </div>
          ))}
        </article>
      </section>
    </AppShell>
  );
}

function sumMetric(metric: "pageViews" | "viewerInteractions" | "arButtonClicks" | "ctaClicks") {
  return products.reduce((sum, product) => sum + (product.analytics?.[metric] ?? 0), 0);
}

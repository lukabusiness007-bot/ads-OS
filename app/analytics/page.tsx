import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getDashboardData } from "@/lib/supabase/data";

export default async function AnalyticsPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Hosted page performance</h1>
          <p className="muted">Track page views, viewer interactions, AR clicks, and store clicks for each published product.</p>
        </div>
        <Link className="button secondary" href="/billing">
          View billing
        </Link>
      </header>

      <section className="grid four">
        <article className="card metric">
          <span className="sectionLabel">Page views</span>
          <strong>{data.totals.pageViews}</strong>
          <span className="badge neutral">All products</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">Interactions</span>
          <strong>{data.totals.viewerInteractions}</strong>
          <span className="badge neutral">3D viewer</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">AR clicks</span>
          <strong>{data.totals.arClicks}</strong>
          <span className="badge neutral">View in room</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">Store CTA</span>
          <strong>{data.totals.storeClicks}</strong>
          <span className="badge success">Back to store</span>
        </article>
      </section>

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
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="emptyTableState">
                      <strong>No analytics yet</strong>
                      <p className="muted">Publish a product page and customer events will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.products.map((product) => (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

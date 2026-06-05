import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductTable } from "@/components/ProductTable";
import { getDashboardData } from "@/lib/supabase/data";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const usagePct = Math.min(100, Math.round((data.totals.published / 25) * 100));
  const hasProducts = data.products.length > 0;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">{data.organization?.name ?? "Pilot workspace"}</p>
          <h1 style={{ marginBottom: 6 }}>Overview</h1>
          <p className="muted" style={{ maxWidth: 560 }}>
            Track products, generation progress, published pages, plan usage, and shopper engagement in one place.
          </p>
        </div>
        <Link className="button accent" href="/create">
          Create AR product
        </Link>
      </header>

      {!data.isConfigured && (
        <div className="assumptionNote">
          Live workspace storage is not connected yet. Finish production setup before inviting pilot merchants.
        </div>
      )}

      {data.setupErrorMessage && (
        <div className="assumptionNote">
          Workspace setup needs attention before live product data can be saved.
        </div>
      )}

      <section className="grid four">
        <article className="card metric">
          <span className="sectionLabel">Total products</span>
          <strong>{data.totals.products}</strong>
          <span className="badge neutral">Catalog</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">Published pages</span>
          <strong>
            {data.totals.published}
            <span style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)" }}>/25</span>
          </strong>
          <span className="badge neutral">Hosted live</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">AR clicks</span>
          <strong>{data.totals.arClicks}</strong>
          <span className="badge neutral">View in room</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">Store clicks</span>
          <strong>{data.totals.storeClicks}</strong>
          <span className="badge neutral">Back to store</span>
        </article>
      </section>

      <section className="grid two">
        <article className="panel stack">
          <div className="row">
            <div>
              <h2>Next actions</h2>
              <p className="muted">Focus on products that need photos, review, or publishing.</p>
            </div>
            <Link className="button secondary sm" href="/create">
              Add product
            </Link>
          </div>
          <ul className="actionList">
            {hasProducts ? (
              <li>
                <strong>{data.totals.processing} products in generation</strong>
                <span>{data.totals.published} published pages are live.</span>
              </li>
            ) : (
              <>
                <li>
                  <strong>1. Create your first product</strong>
                  <span>Add the product name, category, store URL, price, and real dimensions.</span>
                </li>
                <li>
                  <strong>2. Upload 4 clean photos</strong>
                  <span>Use front, side or three-quarter, back, and top or detail views.</span>
                </li>
                <li>
                  <strong>3. Review the generated preview</strong>
                  <span>Check resemblance, scale, orientation, loading, and AR readiness before publishing.</span>
                </li>
                <li>
                  <strong>4. Publish and measure</strong>
                  <span>Add the hosted link to your store, then track AR and store clicks here.</span>
                </li>
              </>
            )}
          </ul>
        </article>

        <article className="panel stack">
          <h2>Plan usage</h2>
          <div>
            <div className="usageBar" aria-label={`${data.totals.published} / 25`}>
              <span style={{ width: `${usagePct}%` }} />
            </div>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              {data.totals.published} / 25 published pages used
            </p>
          </div>
          <Link className="button ghost" href="/billing">
            View billing details
          </Link>
        </article>
      </section>

      <section className="panel">
        <div className="row">
          <div>
            <h2>Products</h2>
            <p className="muted">Your pilot catalog will show product status, hosted links, and engagement metrics here.</p>
          </div>
          <Link className="button secondary sm" href="/published-links">
            Published links
          </Link>
        </div>
        <ProductTable
          items={data.products}
          emptyTitle="No products yet"
          emptyDescription="Create your first AR product to begin the pilot workflow."
        />
      </section>
    </AppShell>
  );
}

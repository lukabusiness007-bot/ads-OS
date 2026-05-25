import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductTable } from "@/components/ProductTable";
import { organization, products } from "@/lib/mock-data";

export default function DashboardPage() {
  const published = products.filter((product) => product.status === "published").length;
  const totalArClicks = products.reduce((sum, product) => sum + (product.analytics?.arButtonClicks ?? 0), 0);
  const totalStoreClicks = products.reduce((sum, product) => sum + (product.analytics?.ctaClicks ?? 0), 0);
  const needsAction = products.filter((product) => product.status !== "published" && product.status !== "generating").length;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Pilot Command Center</p>
          <h1>{organization.name}</h1>
          <p className="muted">
            Upload photos, review verified AR pages, publish hosted links, and measure shopper engagement.
          </p>
        </div>
        <Link className="button accent" href="/create">
          Create AR page
        </Link>
      </header>

      <section className="grid four">
        <article className="card metric">
          <span className="muted">Catalog status</span>
          <strong>{products.length}</strong>
          <span className="badge neutral">Pilot SKUs</span>
        </article>
        <article className="card metric">
          <span className="muted">Published pages</span>
          <strong>{published}/25</strong>
          <span className="badge success">Hosted links live</span>
        </article>
        <article className="card metric">
          <span className="muted">AR clicks</span>
          <strong>{totalArClicks}</strong>
          <span className="badge neutral">Pilot total</span>
        </article>
        <article className="card metric">
          <span className="muted">Store clicks</span>
          <strong>{totalStoreClicks}</strong>
          <span className="badge neutral">Back to store</span>
        </article>
      </section>

      <section className="grid two">
        <article className="panel stack">
          <div className="row">
            <div>
              <h2>Next required actions</h2>
              <p className="muted">{needsAction} products need merchant attention.</p>
            </div>
            <Link className="button secondary" href="/create">
              Add product
            </Link>
          </div>
          <ul className="actionList">
            <li>
              <strong>Vale Wall Shelf</strong>
              <span>Add one sharper material/detail photo before generation review.</span>
            </li>
            <li>
              <strong>Mira Table Lamp</strong>
              <span>Waiting for model generation and quality review.</span>
            </li>
          </ul>
        </article>

        <article className="panel stack">
          <h2>Current plan usage</h2>
          <div className="usageBar" aria-label="Published page usage">
            <span style={{ width: "4%" }} />
          </div>
          <p className="muted">1 of 25 pilot hosted pages published. Model creation is billed per approved model.</p>
          <div className="assetGrid">
            <span className="badge neutral">10-25 SKU pilot</span>
            <span className="badge success">Human-reviewed before publishing</span>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="row">
          <div>
            <h2>Products</h2>
            <p className="muted">Action, publishing state, and product-level performance.</p>
          </div>
          <Link className="button secondary" href="/published-links">
            Published links
          </Link>
        </div>
        <ProductTable />
      </section>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductTable } from "@/components/ProductTable";
import { organization, products } from "@/lib/mock-data";

export default function DashboardPage() {
  const published = products.filter((p) => p.status === "published").length;
  const totalArClicks = products.reduce((s, p) => s + (p.analytics?.arButtonClicks ?? 0), 0);
  const totalStoreClicks = products.reduce((s, p) => s + (p.analytics?.ctaClicks ?? 0), 0);
  const needsAction = products.filter(
    (p) => p.status !== "published" && p.status !== "generating"
  ).length;

  const usagePct = Math.round((published / 25) * 100);

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Pilot Command Center</p>
          <h1 style={{ marginBottom: 6 }}>{organization.name}</h1>
          <p className="muted" style={{ maxWidth: 520 }}>
            Upload photos, review verified AR pages, publish hosted links, and measure shopper engagement.
          </p>
        </div>
        <Link className="button accent" href="/create">
          + Create AR page
        </Link>
      </header>

      {/* KPI cards */}
      <section className="grid four">
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Catalog status</span>
          <strong>{products.length}</strong>
          <span className="badge neutral">Pilot SKUs</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Published pages</span>
          <strong>{published}<span style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)" }}>/25</span></strong>
          <span className="badge success">Hosted and live</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>AR clicks</span>
          <strong>{totalArClicks}</strong>
          <span className="badge neutral">Pilot total</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Store clicks</span>
          <strong>{totalStoreClicks}</strong>
          <span className="badge neutral">Back to store</span>
        </article>
      </section>

      {/* Action panel + Usage panel */}
      <section className="grid two">
        <article className="panel stack">
          <div className="row">
            <div>
              <h2>Next required actions</h2>
              <p className="muted">{needsAction} product{needsAction !== 1 ? "s" : ""} need attention.</p>
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
          <div>
            <div className="usageBar" aria-label={`Published page usage: ${published} of 25`}>
              <span style={{ width: `${usagePct}%` }} />
            </div>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              {published} of 25 pilot hosted pages published.
            </p>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
            Model creation is billed per approved model. Hosted-page subscription covers all live pages.
          </p>
          <div className="assetGrid">
            <span className="badge neutral">10–25 SKU pilot</span>
            <span className="badge success">Human-reviewed before publishing</span>
          </div>
          <Link className="button secondary" href="/analytics-billing" style={{ width: "fit-content" }}>
            View billing details
          </Link>
        </article>
      </section>

      {/* Products table */}
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

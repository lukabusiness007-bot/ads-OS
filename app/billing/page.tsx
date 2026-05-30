import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { pricingPackages, products } from "@/lib/mock-data";

export default function BillingPage() {
  const published = products.filter((p) => p.status === "published").length;
  const usagePct = Math.round((published / 25) * 100);

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Billing</p>
          <h1>Pilot plan and costs</h1>
          <p className="muted">
            Per-approved-model fee plus a monthly hosted-page subscription. Simple and predictable.
          </p>
        </div>
        <Link className="button secondary" href="/analytics">
          View analytics
        </Link>
      </header>

      {/* Plan usage */}
      <section className="panel stack">
        <div className="row">
          <div>
            <h2>Current plan usage</h2>
            <p className="muted">10–25 SKU pilot</p>
          </div>
          <span className="badge success">Active</span>
        </div>
        <div>
          <div className="usageBar" aria-label={`${published} of 25 hosted pages published`}>
            <span style={{ width: `${usagePct}%` }} />
          </div>
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            {published} of 25 pilot hosted pages published
          </p>
        </div>
        <div className="assetGrid">
          <span className="badge neutral">{published} page{published !== 1 ? "s" : ""} live</span>
          <span className="badge neutral">{25 - published} page{(25 - published) !== 1 ? "s" : ""} remaining</span>
          <span className="badge success">Human-reviewed before publishing</span>
        </div>
      </section>

      {/* Pricing */}
      <section className="panel stack">
        <div>
          <h2>Pricing breakdown</h2>
          <p className="muted">
            Billed per approved model plus a monthly subscription for hosted pages. Revision or
            regeneration is only charged when a new version is requested after an approved model
            already exists.
          </p>
        </div>
        {pricingPackages.slice(0, 3).map((item) => (
          <div className="lineItem" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <p className="muted">{item.description}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <span className="pricePill">{item.priceRangeEur}</span>
              <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>{item.billingUnit}</p>
            </div>
          </div>
        ))}
      </section>

      {/* What's included */}
      <section className="panel stack">
        <h2>What&apos;s included in the pilot</h2>
        <div className="grid two">
          {[
            ["Guided photo upload", "Step-by-step checklist for all required product angles."],
            ["Model generation", "Automated generation run for each submitted product."],
            ["Human quality review", "Manual approval gate before any page goes live."],
            ["Hosted product page", "Public link for your store, email, ad, or QR code."],
            ["3D viewer and AR launch", "Shoppers inspect the product in 3D and launch AR on supported devices."],
            ["Engagement analytics", "Page views, AR clicks, and store CTA clicks — per product."],
          ].map(([title, desc]) => (
            <article className="card" key={title}>
              <strong style={{ display: "block", marginBottom: 4 }}>{title}</strong>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>{desc}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

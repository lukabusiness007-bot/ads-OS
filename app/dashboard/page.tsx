"use client"

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductTable } from "@/components/ProductTable";
import { useLang } from "@/lib/lang";

export default function DashboardPage() {
  const { tr } = useLang()
  const d = tr.dashboard

  const published = 0;
  const totalProducts = 0;
  const totalArClicks = 0;
  const totalStoreClicks = 0;
  const usagePct = 0;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">{d.eyebrow}</p>
          <h1 style={{ marginBottom: 6 }}>{d.heading}</h1>
          <p className="muted" style={{ maxWidth: 520 }}>
            {d.subtitle}
          </p>
        </div>
        <Link className="button accent" href="/create">
          {d.createBtn}
        </Link>
      </header>

      {/* KPI cards */}
      <section className="grid four">
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.catalogStatus}</span>
          <strong>{totalProducts}</strong>
          <span className="badge neutral">{d.noProducts}</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.publishedPages}</span>
          <strong>{published}<span style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)" }}>/25</span></strong>
          <span className="badge neutral">{d.hostedLive}</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.arClicks}</span>
          <strong>{totalArClicks}</strong>
          <span className="badge neutral">{d.noActivity}</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.storeClicks}</span>
          <strong>{totalStoreClicks}</strong>
          <span className="badge neutral">{d.backToStore}</span>
        </article>
      </section>

      {/* Action panel + Usage panel */}
      <section className="grid two">
        <article className="panel stack">
          <div className="row">
            <div>
              <h2>{d.nextActions}</h2>
              <p className="muted">
                {d.emptyActionDesc}
              </p>
            </div>
            <Link className="button secondary sm" href="/create">
              {d.addProduct}
            </Link>
          </div>
          <ul className="actionList">
            <li>
              <strong>{d.actionItemTitle}</strong>
              <span>{d.actionItemDesc}</span>
            </li>
          </ul>
        </article>

        <article className="panel stack">
          <h2>{d.planUsage}</h2>
          <div>
            <div className="usageBar" aria-label={`${published} / 25`}>
              <span style={{ width: `${usagePct}%` }} />
            </div>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              {published} / 25 {d.pagesPublished}
            </p>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
            {d.billingNote}
          </p>
          <div className="assetGrid">
            <span className="badge neutral">10–25 SKU pilot</span>
            <span className="badge success">{d.humanReviewed}</span>
          </div>
          <Link className="button ghost" href="/analytics-billing">
            {d.viewBilling}
          </Link>
        </article>
      </section>

      {/* Products table */}
      <section className="panel">
        <div className="row">
          <div>
            <h2>{d.productsHeading}</h2>
            <p className="muted">{d.productsDesc}</p>
          </div>
          <Link className="button secondary sm" href="/published-links">
            {d.publishedLinksBtn}
          </Link>
        </div>
        <ProductTable
          items={[]}
          emptyTitle={d.emptyProductsTitle}
          emptyDescription={d.emptyProductsDesc}
        />
      </section>
    </AppShell>
  );
}

"use client"

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { products } from "@/lib/mock-data";
import { useLang } from "@/lib/lang";

function sumMetric(metric: "pageViews" | "viewerInteractions" | "arButtonClicks" | "ctaClicks") {
  return products.reduce((sum, p) => sum + (p.analytics?.[metric] ?? 0), 0);
}

export default function AnalyticsPage() {
  const { tr } = useLang();
  const a = tr.analytics;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">{a.eyebrow}</p>
          <h1>{a.heading}</h1>
          <p className="muted">{a.subtitle}</p>
        </div>
        <Link className="button secondary" href="/billing">
          {a.viewBilling}
        </Link>
      </header>

      <section className="grid four">
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {a.pageViews}
          </span>
          <strong>{sumMetric("pageViews")}</strong>
          <span className="badge neutral">{a.allProducts}</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {a.viewerInteractions}
          </span>
          <strong>{sumMetric("viewerInteractions")}</strong>
          <span className="badge neutral">{a.engagements3d}</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {a.arClicks}
          </span>
          <strong>{sumMetric("arButtonClicks")}</strong>
          <span className="badge neutral">{a.viewInRoom}</span>
        </article>
        <article className="card metric">
          <span className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {a.storeCta}
          </span>
          <strong>{sumMetric("ctaClicks")}</strong>
          <span className="badge success">{a.backToStore}</span>
        </article>
      </section>

      <section className="panel">
        <div style={{ marginBottom: 16 }}>
          <h2>{a.breakdown}</h2>
          <p className="muted">{a.breakdownDesc}</p>
        </div>
        <div className="responsiveTable">
          <table className="table">
            <thead>
              <tr>
                <th>{a.colProduct}</th>
                <th>{a.colPageViews}</th>
                <th>{a.colInteractions}</th>
                <th>{a.colArClicks}</th>
                <th>{a.colStoreClicks}</th>
                <th>{a.colTopDevices}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td data-label={a.colProduct}>
                    <strong>{product.name}</strong>
                    <p className="muted" style={{ marginBottom: 0, fontSize: 13 }}>
                      {product.category.replace("_", " ")}
                    </p>
                  </td>
                  <td data-label={a.colPageViews}>{product.analytics?.pageViews ?? 0}</td>
                  <td data-label={a.colInteractions}>{product.analytics?.viewerInteractions ?? 0}</td>
                  <td data-label={a.colArClicks}>{product.analytics?.arButtonClicks ?? 0}</td>
                  <td data-label={a.colStoreClicks}>{product.analytics?.ctaClicks ?? 0}</td>
                  <td data-label={a.colTopDevices}>
                    {product.analytics?.topDevices.length
                      ? product.analytics.topDevices.map((d) => `${d.type} ${d.share}%`).join(", ")
                      : <span className="muted">{a.noData}</span>}
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

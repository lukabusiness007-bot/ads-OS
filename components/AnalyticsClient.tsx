"use client"

import Link from "next/link"
import { useLang } from "@/lib/lang"
import type { DashboardData } from "@/lib/supabase/data"

export function AnalyticsClient({ data }: { data: DashboardData }) {
  const { tr } = useLang()
  const a = tr.analytics

  return (
    <>
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

      <section className="grid metrics">
        <article className="card metric">
          <span className="sectionLabel">{a.pageViews}</span>
          <strong>{data.totals.pageViews}</strong>
          <span className="badge neutral">{a.allProducts}</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">{a.embedViews}</span>
          <strong>{data.totals.embedViews}</strong>
          <span className="badge neutral">{a.embedded}</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">{a.viewerInteractions}</span>
          <strong>{data.totals.viewerInteractions}</strong>
          <span className="badge neutral">{a.engagements3d}</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">{a.arClicks}</span>
          <strong>{data.totals.arClicks}</strong>
          <span className="badge neutral">{a.viewInRoom}</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">{a.storeCta}</span>
          <strong>{data.totals.storeClicks}</strong>
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
                <th>{a.colEmbedViews}</th>
                <th>{a.colInteractions}</th>
                <th>{a.colArClicks}</th>
                <th>{a.colStoreClicks}</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="emptyTableState">
                      <strong>{a.noData}</strong>
                      <p className="muted">{tr.dashboard.emptyProductsDesc}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.products.map((product) => (
                  <tr key={product.id}>
                    <td data-label={a.colProduct}>
                      <strong>{product.name}</strong>
                      <p className="muted" style={{ marginBottom: 0, fontSize: 13 }}>
                        {product.category.replace("_", " ")}
                      </p>
                    </td>
                    <td data-label={a.colPageViews}>{product.analytics?.pageViews ?? 0}</td>
                    <td data-label={a.colEmbedViews}>{product.analytics?.embedViews ?? 0}</td>
                    <td data-label={a.colInteractions}>{product.analytics?.viewerInteractions ?? 0}</td>
                    <td data-label={a.colArClicks}>{product.analytics?.arButtonClicks ?? 0}</td>
                    <td data-label={a.colStoreClicks}>{product.analytics?.ctaClicks ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

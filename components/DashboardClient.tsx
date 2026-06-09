"use client"

import Link from "next/link"
import { ProductAssetCard } from "@/components/ProductAssetCard"
import { ProductTable } from "@/components/ProductTable"
import { Reveal, RevealStagger } from "@/components/Reveal"
import { useLang } from "@/lib/lang"
import type { DashboardData } from "@/lib/supabase/data"

export function DashboardClient({ data }: { data: DashboardData }) {
  const { tr } = useLang()
  const d = tr.dashboard
  const x = tr.dashboardExtra

  const usagePct = Math.min(100, Math.round((data.totals.published / 25) * 100))
  const hasProducts = data.products.length > 0

  const awaitingReview = data.products.filter((p) => p.status === "awaiting_review").length
  const readyToPublish = data.products.filter((p) => p.status === "approved").length
  const needsRevision = data.products.filter(
    (p) => p.status === "rejected" || p.status === "generation_failed"
  ).length
  const generating = data.products.filter((p) => p.status === "generating").length

  const subtitle =
    data.totals.published > 0
      ? data.totals.arClicks > 0
        ? `${x.modelsLive(data.totals.published)} ${x.arViewsWeek(data.totals.arClicks)}`
        : `${x.modelsLive(data.totals.published)} ${x.startPublishing}`
      : x.startPublishing.replace("· ", "")

  return (
    <>
      {/* ── Hero band ─────────────────────────────────────────── */}
      <Reveal variant="up">
        <header className="dashHero bg-dotgrid">
          <div
            className="glow-blob glow-blob--emerald"
            style={{ width: 500, height: 320, top: -80, right: -40, opacity: 0.6 }}
            aria-hidden="true"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              position: "relative",
              flexWrap: "wrap"
            }}
          >
            <div>
              <p className="eyebrow" style={{ color: "#6ee7b7", marginBottom: 6 }}>
                {data.organization?.name ?? "Pilot workspace"}
              </p>
              <h1 style={{ color: "#f8fbf5", marginBottom: 6 }}>{x.overviewHeading}</h1>
              <p style={{ color: "#9fb3a1", margin: 0, fontSize: 15 }}>{subtitle}</p>
            </div>
            <Link
              className="button"
              href="/create"
              style={{ background: "#10b981", borderColor: "#10b981", flexShrink: 0, fontSize: 15 }}
            >
              {d.createBtn}
            </Link>
          </div>
        </header>
      </Reveal>

      {(!data.isConfigured || data.setupErrorMessage) && (
        <div className="assumptionNote">
          {data.setupErrorMessage ? x.configWarning : x.configNotConnected}
        </div>
      )}

      {/* ── Product cards + quick actions ─────────────────────── */}
      <Reveal as="section" variant="up" delay={120}>
        <div
          style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 280px", alignItems: "start" }}
          className="createTwoCol"
        >
          {/* Asset-first product cards */}
          <div style={{ display: "grid", gap: 16 }}>
            <div className="row">
              <div>
                <h2 style={{ marginBottom: 4 }}>{d.productsHeading}</h2>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                  {hasProducts
                    ? `${data.products.length} ${data.products.length === 1 ? "proizvod" : "proizvoda"} u katalogu`
                    : d.emptyProductsDesc}
                </p>
              </div>
              {hasProducts && (
                <Link className="button secondary sm" href="/published-links">
                  {d.publishedLinksBtn}
                </Link>
              )}
            </div>

            {hasProducts ? (
              <RevealStagger className="productCardGrid" variant="scale" initialDelay={80} step={60}>
                {data.products.map((product) => (
                  <ProductAssetCard key={product.id} product={product} />
                ))}
              </RevealStagger>
            ) : (
              <div
                style={{
                  background: "var(--surface)",
                  border: "2px dashed var(--line)",
                  borderRadius: 12,
                  padding: "42px 28px",
                  textAlign: "center",
                  display: "grid",
                  gap: 14,
                  justifyItems: "center"
                }}
              >
                <p style={{ color: "var(--muted)", maxWidth: 380, margin: 0 }}>
                  {d.emptyProductsDesc}
                </p>
                <Link className="button accent" href="/create">
                  {d.createBtn}
                </Link>
              </div>
            )}
          </div>

          {/* Side column */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Next actions */}
            <article className="panel stack">
              <h2 style={{ marginBottom: 4 }}>{d.nextActions}</h2>
              {!hasProducts ? (
                <ul className="actionList">
                  <li>
                    <strong>{d.actionItemTitle}</strong>
                    <span>{d.actionItemDesc}</span>
                  </li>
                </ul>
              ) : (
                <ul className="actionList">
                  {needsRevision > 0 && (
                    <li>
                      <strong>{x.needsRevision(needsRevision)}</strong>
                      <span>
                        <Link href="/create" style={{ color: "var(--accent)", fontWeight: 700 }}>
                          {tr.productCard.regenerate} →
                        </Link>{" "}
                        {x.needsRevisionDesc}
                      </span>
                    </li>
                  )}
                  {awaitingReview > 0 && (
                    <li>
                      <strong>{x.awaitingReviewCount(awaitingReview)}</strong>
                      <span>
                        <Link href="/approval" style={{ color: "var(--accent)", fontWeight: 700 }}>
                          {tr.approval.awaitingReview} →
                        </Link>{" "}
                        {x.awaitingReviewDesc}
                      </span>
                    </li>
                  )}
                  {readyToPublish > 0 && (
                    <li>
                      <strong>{x.readyToPublish(readyToPublish)}</strong>
                      <span>
                        <Link href="/published-links" style={{ color: "var(--accent)", fontWeight: 700 }}>
                          {d.publishedLinksBtn} →
                        </Link>{" "}
                        {x.readyToPublishDesc}
                      </span>
                    </li>
                  )}
                  {generating > 0 && (
                    <li>
                      <strong>{x.generatingCount(generating)}</strong>
                      <span>
                        <Link href="/status" style={{ color: "var(--accent)", fontWeight: 700 }}>
                          {tr.statusExtra.currentStatusHeading} →
                        </Link>{" "}
                        {x.generatingDesc}
                      </span>
                    </li>
                  )}
                  {data.totals.published > 0 &&
                    needsRevision === 0 &&
                    awaitingReview === 0 &&
                    readyToPublish === 0 && (
                      <li>
                        <strong>{x.pagesLiveCount(data.totals.published)}</strong>
                        <span>{x.pagesLiveDesc}</span>
                      </li>
                    )}
                </ul>
              )}
            </article>

            {/* Plan usage */}
            <article className="panel stack">
              <h2 style={{ marginBottom: 0 }}>{d.planUsage}</h2>
              <div>
                <div
                  className="usageBar"
                  aria-label={`${data.totals.published} ${x.planOf} 25 ${x.pagesUsed}`}
                >
                  <span style={{ width: `${usagePct}%` }} />
                </div>
                <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                  {data.totals.published} {x.planOf} 25 {x.pagesUsed}
                </p>
              </div>
              <Link className="button ghost" href="/billing">
                {d.viewBilling}
              </Link>
            </article>
          </div>
        </div>
      </Reveal>

      {/* ── Compact table toggle (power users) ────────────────── */}
      {hasProducts && (
        <Reveal as="section" variant="up" delay={200}>
          <details className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <summary
              style={{
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                listStyle: "none",
                padding: "14px 22px",
                userSelect: "none"
              }}
            >
              {x.allProductsTable}
            </summary>
            <div style={{ padding: "0 22px 22px" }}>
              <ProductTable
                items={data.products}
                emptyTitle={d.emptyProductsTitle}
                emptyDescription={d.emptyProductsDesc}
              />
            </div>
          </details>
        </Reveal>
      )}
    </>
  )
}

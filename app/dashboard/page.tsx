import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductAssetCard } from "@/components/ProductAssetCard";
import { ProductTable } from "@/components/ProductTable";
import { Reveal, RevealStagger } from "@/components/Reveal";
import { getDashboardData } from "@/lib/supabase/data";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const usagePct = Math.min(100, Math.round((data.totals.published / 25) * 100));
  const hasProducts = data.products.length > 0;

  const awaitingReview = data.products.filter((p) => p.status === "awaiting_review").length;
  const readyToPublish = data.products.filter((p) => p.status === "approved").length;
  const needsRevision = data.products.filter(
    (p) => p.status === "rejected" || p.status === "generation_failed"
  ).length;
  const generating = data.products.filter((p) => p.status === "generating").length;

  const metrics = [
    { label: "Total products", value: data.totals.products, badge: "Catalog" },
    {
      label: "Published pages",
      value: (
        <>
          {data.totals.published}
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)" }}>/25</span>
        </>
      ),
      badge: "Hosted live"
    },
    { label: "AR clicks", value: data.totals.arClicks, badge: "View in room" },
    { label: "Store clicks", value: data.totals.storeClicks, badge: "Back to store" }
  ];

  return (
    <AppShell>
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
              <p
                className="eyebrow"
                style={{ color: "#6ee7b7", marginBottom: 6 }}
              >
                {data.organization?.name ?? "Pilot workspace"}
              </p>
              <h1 style={{ color: "#f8fbf5", marginBottom: 6 }}>Overview</h1>
              <p style={{ color: "#9fb3a1", margin: 0, fontSize: 15 }}>
                {data.totals.published} model{data.totals.published !== 1 ? "s" : ""} live
                {data.totals.arClicks > 0
                  ? ` · ${data.totals.arClicks} AR view${data.totals.arClicks !== 1 ? "s" : ""} this week`
                  : " · start publishing to see engagement"}
              </p>
            </div>
            <Link
              className="button"
              href="/create"
              style={{
                background: "#10b981",
                borderColor: "#10b981",
                flexShrink: 0,
                fontSize: 15
              }}
            >
              + Create AR product
            </Link>
          </div>
        </header>
      </Reveal>

      {(!data.isConfigured || data.setupErrorMessage) && (
        <div className="assumptionNote">
          {data.setupErrorMessage
            ? "Workspace setup needs attention before live product data can be saved."
            : "Live workspace storage is not connected yet. Finish production setup before inviting pilot merchants."}
        </div>
      )}

      {/* ── Metric cards ───────────────────────────────────────── */}
      <RevealStagger as="section" className="grid four" variant="up" initialDelay={60} step={80}>
        {metrics.map((m, i) => (
          <article className="metricCard" key={i}>
            <span className="sectionLabel">{m.label}</span>
            <strong>{m.value}</strong>
            <span className="badge neutral">{m.badge}</span>
          </article>
        ))}
      </RevealStagger>

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
                <h2 style={{ marginBottom: 4 }}>Products</h2>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                  {hasProducts
                    ? `${data.products.length} product${data.products.length !== 1 ? "s" : ""} in your catalog`
                    : "Create your first AR product to get started."}
                </p>
              </div>
              {hasProducts && (
                <Link className="button secondary sm" href="/published-links">
                  Published links
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
                  Upload 3–6 product photos and we&apos;ll generate a rotating 3D model
                  with an AR viewer for your store.
                </p>
                <Link className="button accent" href="/create">
                  Create your first AR product
                </Link>
              </div>
            )}
          </div>

          {/* Side column */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Next actions */}
            <article className="panel stack">
              <h2 style={{ marginBottom: 4 }}>Next actions</h2>
              {!hasProducts ? (
                <ul className="actionList">
                  <li>
                    <strong>1. Upload product photos</strong>
                    <span>Drop 3–6 JPG or PNG photos — front, side, back, and detail views work best.</span>
                  </li>
                  <li>
                    <strong>2. Review the 3D model</strong>
                    <span>Check color, scale, and AR readiness before publishing.</span>
                  </li>
                  <li>
                    <strong>3. Publish and measure</strong>
                    <span>Add the hosted link to your store and track AR engagement here.</span>
                  </li>
                </ul>
              ) : (
                <ul className="actionList">
                  {needsRevision > 0 && (
                    <li>
                      <strong>
                        {needsRevision} product{needsRevision !== 1 ? "s" : ""} need{needsRevision === 1 ? "s" : ""} revision
                      </strong>
                      <span>
                        <Link href="/create" style={{ color: "var(--accent)", fontWeight: 700 }}>
                          Regenerate →
                        </Link>{" "}
                        Re-upload with clearer photos or contact support.
                      </span>
                    </li>
                  )}
                  {awaitingReview > 0 && (
                    <li>
                      <strong>
                        {awaitingReview} awaiting your review
                      </strong>
                      <span>
                        <Link href="/approval" style={{ color: "var(--accent)", fontWeight: 700 }}>
                          Go to Approval →
                        </Link>{" "}
                        Check resemblance, scale, and AR readiness.
                      </span>
                    </li>
                  )}
                  {readyToPublish > 0 && (
                    <li>
                      <strong>
                        {readyToPublish} approved — ready to publish
                      </strong>
                      <span>
                        <Link href="/published-links" style={{ color: "var(--accent)", fontWeight: 700 }}>
                          Published links →
                        </Link>{" "}
                        Copy the hosted link for your store.
                      </span>
                    </li>
                  )}
                  {generating > 0 && (
                    <li>
                      <strong>{generating} generating</strong>
                      <span>
                        <Link href="/status" style={{ color: "var(--accent)", fontWeight: 700 }}>
                          Check status →
                        </Link>{" "}
                        3D model creation in progress.
                      </span>
                    </li>
                  )}
                  {data.totals.published > 0 &&
                    needsRevision === 0 &&
                    awaitingReview === 0 &&
                    readyToPublish === 0 && (
                      <li>
                        <strong>{data.totals.published} page{data.totals.published !== 1 ? "s" : ""} live</strong>
                        <span>Share hosted links in your store, ads, or emails to drive AR engagement.</span>
                      </li>
                    )}
                </ul>
              )}
            </article>

            {/* Plan usage */}
            <article className="panel stack">
              <h2 style={{ marginBottom: 0 }}>Plan usage</h2>
              <div>
                <div
                  className="usageBar"
                  aria-label={`${data.totals.published} of 25 published pages used`}
                >
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
              All products — table view
            </summary>
            <div style={{ padding: "0 22px 22px" }}>
              <ProductTable
                items={data.products}
                emptyTitle="No products yet"
                emptyDescription="Create your first AR product to begin."
              />
            </div>
          </details>
        </Reveal>
      )}
    </AppShell>
  );
}

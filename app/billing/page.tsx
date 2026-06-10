"use client"

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { GenerationUsageCard } from "@/components/GenerationUsageCard";
import { billingTiers, organization, pricingPackages, products } from "@/lib/mock-data";
import { openBillingPortal, startBillingCheckout } from "@/lib/billing/checkout-client";
import { useLang } from "@/lib/lang";

const TIER_ORDER = ["starter", "growth", "studio", "business"];

export default function BillingPage() {
  const { tr } = useLang();
  const b = tr.billing;

  const published = products.filter((p) => p.status === "published").length;
  const usagePct = Math.round((published / 25) * 100);
  const currentTierIndex = TIER_ORDER.indexOf(organization.planTier);

  function fmtViews(n: number | null) {
    if (!n) return b.custom;
    return n >= 1000 ? `${n / 1000}k` : String(n);
  }

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">{b.eyebrow}</p>
          <h1>{b.heading}</h1>
          <p className="muted">{b.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button secondary" onClick={() => { void openBillingPortal(); }}>
            Manage billing
          </button>
          <Link className="button secondary" href="/analytics">
            {b.viewAnalytics}
          </Link>
        </div>
      </header>

      <GenerationUsageCard />

      <section className="panel stack">
        <div className="row">
          <div>
            <h2>{b.planUsageHeading}</h2>
            <p className="muted">{b.planUsageSub}</p>
          </div>
          <span className="badge success">{b.active}</span>
        </div>
        <div>
          <div className="usageBar" aria-label={`${published} / 25`}>
            <span style={{ width: `${usagePct}%` }} />
          </div>
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            {published} / 25 {b.pagesPublished}
          </p>
        </div>
        <div className="assetGrid">
          <span className="badge neutral">{published} {b.pagesLive}</span>
          <span className="badge neutral">{25 - published} {b.pagesRemaining}</span>
          <span className="badge success">{b.humanReviewed}</span>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2>{b.subscriptionHeading}</h2>
          <p className="muted">{b.subscriptionDesc}</p>
        </div>
        <div className="grid four" style={{ gap: 12, alignItems: "stretch" }}>
          {billingTiers.map((tier) => {
            const tierIndex = TIER_ORDER.indexOf(tier.id);
            const isCurrent = tier.id === organization.planTier;
            const isUpgrade = tierIndex > currentTierIndex;
            const isLower = tierIndex < currentTierIndex;
            return (
              <div
                key={tier.id}
                className="card stack"
                style={{
                  border: isCurrent ? "2px solid var(--accent)" : undefined,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                  <strong>{tier.name}</strong>
                  {isCurrent && <span className="badge success">{b.currentPlan}</span>}
                  {tier.recommended && !isCurrent && (
                    <span className="badge neutral">{b.popular}</span>
                  )}
                </div>
                <div>
                  {tier.monthlyUsd ? (
                    <>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>€{tier.monthlyUsd}</span>
                      <span className="muted" style={{ fontSize: 12 }}>{b.perMonth}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{b.custom}</span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, padding: "8px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                  {[
                    [tier.publishedSkuLimit ?? "∞", b.skus],
                    [tier.storageGb ? `${tier.storageGb} GB` : b.custom, b.storage],
                    [fmtViews(tier.monthlyViewLimit) + b.perMonth, b.views],
                  ].map(([val, label]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{val}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--muted)", flexGrow: 1 }}>
                  {tier.includes.slice(0, 2).map((item) => (
                    <li key={item} style={{ marginBottom: 3 }}>{item}</li>
                  ))}
                </ul>
                {isCurrent && (
                  <button className="button secondary" style={{ width: "100%", cursor: "default" }} disabled>
                    {b.currentPlan}
                  </button>
                )}
                {isUpgrade && tier.id !== "business" && (
                  <button
                    className="button accent"
                    style={{ width: "100%" }}
                    onClick={() => { void startBillingCheckout({ plan: tier.id, withSetupFee: true }); }}
                  >
                    {b.upgradeTo} {tier.name}
                  </button>
                )}
                {isLower && (
                  <button
                    className="button secondary"
                    style={{ width: "100%" }}
                    onClick={() => { void startBillingCheckout({ plan: tier.id }); }}
                  >
                    {b.downgradeTo} {tier.name}
                  </button>
                )}
                {tier.id === "business" && (
                  <a className="button secondary" href="mailto:hello@augmenta3d.com" style={{ width: "100%", textAlign: "center" }}>
                    {b.talkToUs}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2>{b.pricingHeading}</h2>
          <p className="muted">{b.pricingDesc}</p>
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

      <section className="panel stack">
        <h2>{b.includedHeading}</h2>
        <div className="grid two">
          {b.includedItems.map(([title, desc]) => (
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

import { AppShell } from "@/components/AppShell";
import {
  billingTiers,
  clientConversation,
  costAssumptions,
  marginScenarios,
  marketReferences,
  modelCreationAddons,
  modelProductionScenarios,
  overagePrices,
  products,
  qualityChecks,
  salesObjections,
  usageScenarios
} from "@/lib/mock-data";

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

const decimalCurrency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  style: "currency"
});

function formatLimit(value: number | null, suffix: string) {
  return value === null ? "Custom" : `${value.toLocaleString()} ${suffix}`;
}

function grossMargin(revenue: number, cost: number) {
  return Math.round(((revenue - cost) / revenue) * 100);
}

export default function BillingPage() {
  const publishedPages = products.filter((product) => product.hostedPage?.status === "published").length;
  const targetTier = billingTiers.find((tier) => tier.id === "growth");
  const fixedMonthlyOverhead = costAssumptions.reduce((total, assumption) => total + (assumption.monthlyUsd ?? 0), 0);
  const growthScenario = marginScenarios.find((scenario) => scenario.tierName === "Growth");

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Shopify-first AR SaaS billing</p>
          <h1>Market-backed pricing for SMB ecommerce pilots</h1>
          <p className="muted">
            The offer is a simple subscription by published 3D/AR SKU, with model creation billed separately so the
            recurring plan stays predictable and margin-protected.
          </p>
        </div>
        <span className="badge success">USD, tax excluded</span>
      </header>

      <section className="grid four">
        <article className="card metric">
          <span className="muted">Primary buyer</span>
          <strong>SMB</strong>
          <span className="badge neutral">Shopify first</span>
        </article>
        <article className="card metric">
          <span className="muted">Pilot catalog</span>
          <strong>10-25</strong>
          <span className="badge success">Published SKUs</span>
        </article>
        <article className="card metric">
          <span className="muted">Default plan</span>
          <strong>{targetTier ? currency.format(targetTier.monthlyUsd ?? 0) : "$89"}</strong>
          <span className="badge warning">Growth tier</span>
        </article>
        <article className="card metric">
          <span className="muted">Workspace pages</span>
          <strong>{publishedPages}</strong>
          <span className="badge neutral">Current mock usage</span>
        </article>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Buyer conversation</p>
          <h2>What the client thinks they are buying</h2>
          <p className="muted">
            The pricing has to translate AR into confidence, lower hesitation, and operational simplicity.
          </p>
        </div>
        <div className="conversationGrid">
          {clientConversation.map((line) => (
            <article className="quoteBlock" key={line.id}>
              <span className="sectionLabel">{line.speaker}</span>
              <p>{line.line}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Market analysis</p>
          <h2>Reference services and pricing lessons</h2>
          <p className="muted">
            The market splits into enterprise quote-led platforms, Shopify apps, and model-production providers. Shopify
            native 3D media remains the free baseline the SaaS must beat.
          </p>
        </div>
        <div className="tableScroller">
          <table className="table marketTable">
            <thead>
              <tr>
                <th>Service</th>
                <th>Segment</th>
                <th>Pricing signal</th>
                <th>Best for</th>
                <th>Lesson for this SaaS</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {marketReferences.map((service) => (
                <tr key={service.id}>
                  <td>
                    <strong>{service.name}</strong>
                  </td>
                  <td>{service.segment}</td>
                  <td>{service.pricingSignal}</td>
                  <td>{service.bestFor}</td>
                  <td>{service.lesson}</td>
                  <td>
                    <a className="textLink" href={service.sourceUrl} rel="noreferrer" target="_blank">
                      {service.sourceLabel}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <div className="row">
          <div>
            <p className="eyebrow">Visible pricing</p>
            <h2>Subscription tiers by published SKU</h2>
            <p className="muted">Client-facing packaging stays simple; storage, views, and support remain guardrails.</p>
          </div>
          <span className="badge success">Target 70%+ SaaS gross margin</span>
        </div>
        <div className="pricingGrid">
          {billingTiers.map((tier) => (
            <article className={`priceTile ${tier.recommended ? "featuredTile" : ""}`} key={tier.id}>
              <div>
                <div className="row compactRow">
                  <h3>{tier.name}</h3>
                  {tier.recommended ? <span className="badge success">Recommended</span> : null}
                </div>
                <p className="muted">{tier.positioning}</p>
              </div>
              <div>
                <strong>{tier.monthlyUsd === null ? "Custom" : `${currency.format(tier.monthlyUsd)}/mo`}</strong>
                <span>{formatLimit(tier.publishedSkuLimit, "published SKUs")}</span>
              </div>
              <dl className="miniStats">
                <div>
                  <dt>Storage</dt>
                  <dd>{formatLimit(tier.storageGb, "GB")}</dd>
                </div>
                <div>
                  <dt>Views</dt>
                  <dd>{formatLimit(tier.monthlyViewLimit, "views/mo")}</dd>
                </div>
              </dl>
              <ul className="checklist">
                {tier.includes.map((line) => (
                  <li key={line}>
                    <span className="checkDot" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid two">
        <div className="panel stack">
          <div>
            <p className="eyebrow">Overages</p>
            <h2>Predictable expansion charges</h2>
          </div>
          <div className="stack">
            {overagePrices.map((overage) => (
              <article className="lineItem" key={overage.id}>
                <div>
                  <strong>{overage.name}</strong>
                  <p className="muted">{overage.guardrail}</p>
                </div>
                <span className="pricePill">
                  {currency.format(overage.priceUsd)} {overage.unit}
                </span>
              </article>
            ))}
          </div>
        </div>

        <div className="panel stack">
          <div>
            <p className="eyebrow">Model add-ons</p>
            <h2>Production is billed separately</h2>
          </div>
          <div className="stack">
            {modelCreationAddons.map((addon) => (
              <article className="lineItem" key={addon.id}>
                <div>
                  <strong>{addon.name}</strong>
                  <p className="muted">{addon.useCase}</p>
                </div>
                <div className="rightStack">
                  <span className="pricePill">{addon.priceUsd}</span>
                  <span className="muted">{addon.cogsTarget}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Internal cost model</p>
          <h2>Costs hidden behind simple pricing</h2>
          <p className="muted">
            Approximate fixed overhead is {decimalCurrency.format(fixedMonthlyOverhead)}/month before usage. It is
            recovered through account gross profit and model add-on margin rather than itemized to SMB buyers.
          </p>
        </div>
        <div className="costGrid">
          {costAssumptions.map((assumption) => (
            <article className="costTile" key={assumption.id}>
              <span className="sectionLabel">{assumption.name}</span>
              <strong>{assumption.monthlyUsd === null ? "Usage based" : `${decimalCurrency.format(assumption.monthlyUsd)}/mo`}</strong>
              <p>{assumption.costBasis}</p>
              <p className="muted">{assumption.billingImpact}</p>
              {assumption.sourceUrl ? (
                <a className="textLink" href={assumption.sourceUrl} rel="noreferrer" target="_blank">
                  {assumption.sourceLabel}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Scenario tests</p>
          <h2>Margin, usage, production, objection, and QA checks</h2>
          <p className="muted">
            These are the acceptance tests for the billing model before it becomes public app pricing.
          </p>
        </div>

        <div className="scenarioGrid">
          <article className="scenarioBlock">
            <h3>Core SaaS margin</h3>
            <div className="tableScroller">
              <table className="table compact">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Revenue</th>
                    <th>Variable cost</th>
                    <th>Storage</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {marginScenarios.map((scenario) => (
                    <tr key={scenario.id}>
                      <td>
                        <strong>{scenario.label}</strong>
                        <p className="muted">{scenario.tierName}</p>
                      </td>
                      <td>{currency.format(scenario.monthlyRevenueUsd)}</td>
                      <td>{decimalCurrency.format(scenario.estimatedVariableCostUsd)}</td>
                      <td>{scenario.storageUsedGb.toFixed(2)}GB</td>
                      <td>
                        <span className="badge success">
                          {grossMargin(scenario.monthlyRevenueUsd, scenario.estimatedVariableCostUsd)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="scenarioBlock">
            <h3>Usage tiers</h3>
            <div className="tableScroller">
              <table className="table compact">
                <thead>
                  <tr>
                    <th>Views</th>
                    <th>Plan</th>
                    <th>Included</th>
                    <th>Overage</th>
                  </tr>
                </thead>
                <tbody>
                  {usageScenarios.map((scenario) => (
                    <tr key={scenario.id}>
                      <td>{scenario.monthlyViews.toLocaleString()}</td>
                      <td>
                        <strong>{scenario.recommendedTier}</strong>
                        <p className="muted">{scenario.note}</p>
                      </td>
                      <td>{scenario.includedViews.toLocaleString()}</td>
                      <td>{currency.format(scenario.overageUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="scenarioBlock">
            <h3>Model production</h3>
            <div className="tableScroller">
              <table className="table compact">
                <thead>
                  <tr>
                    <th>Pilot</th>
                    <th>Add-on</th>
                    <th>Revenue</th>
                    <th>Revisions</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {modelProductionScenarios.map((scenario) => (
                    <tr key={scenario.id}>
                      <td>{scenario.skuCount} SKUs</td>
                      <td>{scenario.addonName}</td>
                      <td>{currency.format(scenario.revenueUsd)}</td>
                      <td>{scenario.expectedRevisions}</td>
                      <td>
                        <span className="badge warning">
                          {grossMargin(scenario.revenueUsd, scenario.estimatedCogsUsd)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="scenarioBlock">
            <h3>Sales objections</h3>
            <div className="stack">
              {salesObjections.map((objection) => (
                <div className="objection" key={objection.id}>
                  <strong>{objection.objection}</strong>
                  <p className="muted">{objection.answer}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="qualityGrid">
          {qualityChecks.map((check) => (
            <article className="checkCard" key={check.id}>
              <span className="badge success">QA</span>
              <strong>{check.label}</strong>
              <p className="muted">{check.acceptance}</p>
            </article>
          ))}
        </div>

        <aside className="assumptionNote">
          <strong>Default implementation assumption:</strong> v1 ships 3D viewer, app-free AR placement, hosted pages,
          and simple analytics. Advanced configurator and virtual try-on stay out of scope until paid demand proves them.
          {growthScenario
            ? ` The Growth plan scenario keeps estimated SaaS gross margin at ${grossMargin(
                growthScenario.monthlyRevenueUsd,
                growthScenario.estimatedVariableCostUsd
              )}%.`
            : null}
        </aside>
      </section>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { launchMetrics, pilotMerchants, pricingPackages, products } from "@/lib/mock-data";

function metricTone(status: string) {
  if (status === "on_track") {
    return "success";
  }

  if (status === "watch") {
    return "warning";
  }

  return "neutral";
}

function merchantStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function LaunchPage() {
  const activePilots = pilotMerchants.filter((merchant) => merchant.status === "active").length;
  const targetProducts = pilotMerchants.reduce((total, merchant) => total + merchant.targetProducts, 0);
  const publishedPages = products.filter((product) => product.hostedPage?.status === "published").length;
  const caseStudyCandidates = pilotMerchants.filter((merchant) => merchant.caseStudyEligible).length;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">MVP commercial launch</p>
          <h1>Sell hosted verified models before integrations</h1>
          <p className="muted">
            Track the first paid pilot offer: simple per-model pricing, monthly hosted pages, and the metrics that prove
            whether merchants will pay.
          </p>
        </div>
        <Link className="button accent" href="/billing">
          Billing setup
        </Link>
      </header>

      <section className="grid four">
        <article className="card metric">
          <span className="muted">Pilot merchants</span>
          <strong>{pilotMerchants.length}</strong>
          <span className="badge success">{activePilots} active</span>
        </article>
        <article className="card metric">
          <span className="muted">Target products</span>
          <strong>{targetProducts}</strong>
          <span className="badge neutral">10-30 per merchant</span>
        </article>
        <article className="card metric">
          <span className="muted">Published pages</span>
          <strong>{publishedPages}</strong>
          <span className="badge warning">Manual approval only</span>
        </article>
        <article className="card metric">
          <span className="muted">Case study candidates</span>
          <strong>{caseStudyCandidates}</strong>
          <span className="badge neutral">Discount eligible</span>
        </article>
      </section>

      <section className="panel stack">
        <div>
          <h2>Pricing v1</h2>
          <p className="muted">Early pricing stays intentionally simple until the hosted-link product proves demand.</p>
        </div>
        <div className="pricingGrid">
          {pricingPackages.map((item) => (
            <article className="priceTile" key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p className="muted">{item.description}</p>
              </div>
              <div>
                <strong>{item.priceRangeEur}</strong>
                <span>{item.billingUnit}</span>
              </div>
              <ul className="checklist">
                {item.includes.map((line) => (
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
            <h2>Pilot pipeline</h2>
            <p className="muted">Furniture and home decor merchants only. Integrations stay deferred.</p>
          </div>
          <div className="tableScroller">
            <table className="table compact">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Case study</th>
                </tr>
              </thead>
              <tbody>
                {pilotMerchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td>
                      <strong>{merchant.name}</strong>
                      <p className="muted">{merchant.category.replace("_", " ")}</p>
                    </td>
                    <td>{merchant.targetProducts}</td>
                    <td>
                      <span className="badge neutral">{merchantStatusLabel(merchant.status)}</span>
                    </td>
                    <td>{merchant.caseStudyEligible ? "Eligible" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel stack">
          <div>
            <h2>Launch metrics</h2>
            <p className="muted">Commercial readiness depends on cost, speed, engagement, and renewal signals.</p>
          </div>
          <div className="launchMetricList">
            {launchMetrics.map((metric) => (
              <div className="launchMetric" key={metric.id}>
                <span className={`badge ${metricTone(metric.status)}`}>{metric.status.replaceAll("_", " ")}</span>
                <strong>{metric.label}</strong>
                <p>
                  {metric.value} <span className="muted">target: {metric.target}</span>
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

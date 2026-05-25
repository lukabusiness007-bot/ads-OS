import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { expansionFeatures, expansionReadinessSignals, pilotMerchants } from "@/lib/mock-data";

function signalTone(status: string) {
  if (status === "ready") {
    return "success";
  }

  if (status === "watch") {
    return "warning";
  }

  return "danger";
}

function featureTone(status: string) {
  if (status === "next") {
    return "success";
  }

  if (status === "planned") {
    return "warning";
  }

  return "neutral";
}

export default function ExpansionPage() {
  const payingMerchants = pilotMerchants.filter((merchant) => merchant.status === "active").length;
  const readinessTarget = 5;
  const gatedFeatures = expansionFeatures.filter((feature) => feature.status !== "deferred").length;
  const deferredFeatures = expansionFeatures.length - gatedFeatures;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Phase 5 post-MVP expansion</p>
          <h1>Expand only after hosted pages prove revenue</h1>
          <p className="muted">
            Keep integrations sequenced behind paying merchant demand, starting with the smallest embed surface before
            platform-specific apps and later verticals.
          </p>
        </div>
        <Link className="button accent" href="/launch">
          Check launch proof
        </Link>
      </header>

      <section className="grid four">
        <article className="card metric">
          <span className="muted">Paying merchants</span>
          <strong>
            {payingMerchants}/{readinessTarget}
          </strong>
          <span className="badge danger">Gate not met</span>
        </article>
        <article className="card metric">
          <span className="muted">First feature</span>
          <strong>Embed</strong>
          <span className="badge success">Lowest integration lift</span>
        </article>
        <article className="card metric">
          <span className="muted">Planned features</span>
          <strong>{gatedFeatures}</strong>
          <span className="badge warning">Revenue gated</span>
        </article>
        <article className="card metric">
          <span className="muted">Deferred bets</span>
          <strong>{deferredFeatures}</strong>
          <span className="badge neutral">API, SDK, construction</span>
        </article>
      </section>

      <section className="panel stack">
        <div>
          <h2>Expansion readiness</h2>
          <p className="muted">Phase 5 starts after 5-10 paying merchants actively use hosted product pages.</p>
        </div>
        <div className="readinessGrid">
          {expansionReadinessSignals.map((signal) => (
            <article className="readinessTile" key={signal.id}>
              <span className={`badge ${signalTone(signal.status)}`}>{signal.status}</span>
              <strong>{signal.label}</strong>
              <p>{signal.value}</p>
              <span className="muted">Target: {signal.target}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2>Feature sequence</h2>
          <p className="muted">Each step keeps the hosted-link product intact and adds distribution only when demand is visible.</p>
        </div>
        <div className="expansionRoadmap">
          {expansionFeatures.map((feature) => (
            <article className="expansionFeature" key={feature.id}>
              <div className="featureRank">{feature.rank}</div>
              <div className="featureBody">
                <div className="row featureHeader">
                  <div>
                    <h3>{feature.name}</h3>
                    <p className="muted">{feature.merchantValue}</p>
                  </div>
                  <span className={`badge ${featureTone(feature.status)}`}>{feature.status}</span>
                </div>

                <div className="featureGrid">
                  <div>
                    <span className="sectionLabel">Trigger</span>
                    <p>{feature.trigger}</p>
                  </div>
                  <div>
                    <span className="sectionLabel">MVP scope</span>
                    <ul className="checklist">
                      {feature.mvpScope.map((scope) => (
                        <li key={scope}>
                          <span className="checkDot" />
                          <span>{scope}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="sectionLabel">Blocked by</span>
                    <p>{feature.blockedBy?.join(", ") ?? "No blocker listed"}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

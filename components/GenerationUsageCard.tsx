"use client";

import { useEffect, useState } from "react";
import { generationTopUps } from "@/lib/mock-data";
import { startBillingCheckout } from "@/lib/billing/checkout-client";

type UsageSummary = {
  planName: string;
  unlimited: boolean;
  included: number;
  includedUsed: number;
  includedRemaining: number | null;
  topupRemaining: number;
  totalRemaining: number | null;
  periodStart: string;
};

export function GenerationUsageCard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPack, setBusyPack] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data?.errorMessage) {
          setError(data.errorMessage);
        } else {
          setUsage(data as UsageSummary);
        }
      })
      .catch(() => active && setError("Could not load usage."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function buyTopup(packId: string) {
    setBusyPack(packId);
    const err = await startBillingCheckout({ topup: packId });
    if (err) {
      setError(err);
      setBusyPack(null);
    }
  }

  const includedUsed = usage?.includedUsed ?? 0;
  const included = usage?.included ?? 0;
  const usedPct = usage && included > 0 ? Math.min(100, Math.round((includedUsed / included) * 100)) : 0;

  return (
    <section className="panel stack">
      <div className="row">
        <div>
          <h2>Model generations</h2>
          <p className="muted">Included generations reset each billing period. Top-up credits carry over.</p>
        </div>
        {usage && (
          <span className="badge success">
            {usage.unlimited ? "Unlimited" : `${usage.totalRemaining ?? 0} left`}
          </span>
        )}
      </div>

      {loading && <p className="muted">Loading usage…</p>}
      {error && !loading && <p className="muted">{error}</p>}

      {usage && !usage.unlimited && (
        <>
          <div>
            <div className="usageBar" aria-label={`${includedUsed} / ${included}`}>
              <span style={{ width: `${usedPct}%` }} />
            </div>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              {includedUsed} / {included} included generations used this period
              {usage.topupRemaining > 0 ? ` · +${usage.topupRemaining} top-up credits` : ""}
            </p>
          </div>
          <div className="assetGrid">
            <span className="badge neutral">{usage.includedRemaining ?? 0} included left</span>
            <span className="badge neutral">{usage.topupRemaining} top-up left</span>
            <span className="badge neutral">{usage.planName} plan</span>
          </div>
        </>
      )}

      {usage && usage.unlimited && (
        <p className="muted">Your plan includes unlimited model generations.</p>
      )}

      {usage && !usage.unlimited && (
        <div className="stack" style={{ gap: 8 }}>
          <p className="muted" style={{ fontSize: 13 }}>Need more this month? Add a top-up pack — credits never expire.</p>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {generationTopUps.map((pack) => (
              <button
                key={pack.id}
                className="button secondary"
                style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 8px" }}
                disabled={busyPack !== null}
                onClick={() => buyTopup(pack.id)}
              >
                <strong style={{ fontSize: 13 }}>{busyPack === pack.id ? "Opening…" : `+${pack.generations}`}</strong>
                <span className="muted" style={{ fontSize: 11 }}>€{pack.priceEur}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

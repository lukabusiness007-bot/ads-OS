import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ViewerMock } from "@/components/ViewerMock";
import { runModelPackageChecks } from "@/lib/generation-pipeline";
import { products } from "@/lib/mock-data";

export default function PreviewPage() {
  const product = products[0];
  const asset = product.modelAsset;
  const checks = asset ? runModelPackageChecks(asset) : [];

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Model preview</p>
          <h1>{product.name}</h1>
          <p className="muted">Merchant-facing preview before manual approval unlocks publishing.</p>
        </div>
        <Link className="button accent" href="/approval">
          Send to review
        </Link>
      </header>

      <section className="grid two">
        <div className="panel stack">
          <ViewerMock />
          <div className="row">
            <span className="badge success">GLB ready</span>
            <span className="badge success">USDZ ready</span>
            <span className="badge neutral">Poster ready</span>
          </div>
        </div>

        <aside className="panel stack">
          <h2>Asset checks</h2>
          <p className="muted">Phase 2 packages raw provider output into web and AR-ready assets before review.</p>
          <ul className="checklist">
            {checks.map((check) => (
              <li key={check.id}>
                <span className="checkDot" />
                <span>
                  <strong>{check.label}:</strong> {check.detail}
                </span>
              </li>
            ))}
          </ul>
          <div className="assetGrid">
            <span className="badge neutral">Triangles {asset?.triangleCount.toLocaleString()}</span>
            <span className="badge neutral">Metadata {asset?.metadataUrl ? "stored" : "missing"}</span>
            <span className="badge neutral">Scale 1 unit = 1 meter</span>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

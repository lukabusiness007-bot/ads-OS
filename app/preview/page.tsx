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
          <p className="eyebrow">Generated model</p>
          <h1>{product.name}</h1>
          <p className="muted">Inspect the generated 3D model, launch AR on supported devices, then send the best version to quality review.</p>
        </div>
        <div className="row">
          <Link className="button secondary" href="/status">
            Regenerate
          </Link>
          <Link className="button accent" href="/approval">
            Send to quality review
          </Link>
        </div>
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
          <p className="muted">Generated output is packaged into web and AR-ready assets before the quality review gate.</p>
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
          <div className="row">
            <a className="button secondary" href={asset?.glbUrl ?? "#"}>
              Open GLB
            </a>
            <a className="button secondary" href={asset?.usdzUrl ?? "#"}>
              Open AR file
            </a>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

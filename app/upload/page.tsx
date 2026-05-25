import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { canStartGeneration, photoAngleLabels, runPhotoPreflight } from "@/lib/generation-pipeline";
import { getPhotoSet, products } from "@/lib/mock-data";

export default function UploadPage() {
  const product = products[2];
  const photoSet = getPhotoSet(product.id);
  const checks = photoSet ? runPhotoPreflight(photoSet) : [];
  const canGenerate = canStartGeneration(checks);

  return (
    <AppShell>
      <header>
        <p className="eyebrow">Guided photo upload wizard</p>
        <h1>Upload 8-20 product photos</h1>
        <p className="muted">
          Phase 2 runs preflight checks before a product can enter Meshy generation.
        </p>
      </header>

      <section className="grid two">
        <div className="panel stack">
          <h2>{product.name}</h2>
          <ul className="checklist">
            {photoSet?.requiredAngles.map((angle) => (
              <li key={angle}>
                <span className="checkDot" />
                <span>{photoAngleLabels[angle]}</span>
              </li>
            ))}
          </ul>
          <div className="field">
            <label htmlFor="files">Product images</label>
            <input id="files" type="file" multiple accept="image/png,image/jpeg,image/webp" />
          </div>
          <div className="row">
            <span className="badge success">{photoSet?.photos.length ?? 0} uploaded</span>
            <span className="badge neutral">JPG, PNG, WebP</span>
            <span className={`badge ${canGenerate ? "success" : "danger"}`}>
              {canGenerate ? "Ready to generate" : "Blocked"}
            </span>
          </div>
          <Link className={`button ${canGenerate ? "accent" : "secondary"}`} href={canGenerate ? "/status" : "/upload"}>
            Start generation
          </Link>
        </div>

        <aside className="panel stack">
          <h2>Preflight results</h2>
          <div className="stack">
            {checks.map((check) => (
              <article className="checkCard" key={check.id}>
                <div className="row">
                  <strong>{check.label}</strong>
                  <span
                    className={`badge ${
                      check.status === "pass" ? "success" : check.status === "warning" ? "warning" : "danger"
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
                <p className="muted">{check.detail}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

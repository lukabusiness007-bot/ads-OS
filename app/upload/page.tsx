"use client"

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { canStartGeneration, photoAngleLabels, runPhotoPreflight } from "@/lib/generation-pipeline";
import { getPhotoSet, products } from "@/lib/mock-data";
import { useLang } from "@/lib/lang";

export default function UploadPage() {
  const { tr } = useLang();
  const u = tr.upload;

  const product = products[2];
  const photoSet = getPhotoSet(product.id);
  const checks = photoSet ? runPhotoPreflight(photoSet) : [];
  const canGenerate = canStartGeneration(checks);

  return (
    <AppShell>
      <header>
        <p className="eyebrow">{u.eyebrow}</p>
        <h1>{u.heading}</h1>
        <p className="muted">{u.subtitle}</p>
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
            <label htmlFor="files">{u.productImages}</label>
            <input id="files" type="file" multiple accept="image/png,image/jpeg" />
          </div>
          <div className="row">
            <span className="badge success">{photoSet?.photos.length ?? 0} {u.uploaded}</span>
            <span className="badge neutral">{u.formats}</span>
            <span className={`badge ${canGenerate ? "success" : "danger"}`}>
              {canGenerate ? u.readyToGenerate : u.blocked}
            </span>
          </div>
          <Link className={`button ${canGenerate ? "accent" : "secondary"}`} href={canGenerate ? "/status" : "/upload"}>
            {u.startGeneration}
          </Link>
        </div>

        <aside className="panel stack">
          <h2>{u.preflightHeading}</h2>
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

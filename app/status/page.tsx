"use client"

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { pipelineStages, runPhotoPreflight } from "@/lib/generation-pipeline";
import { generationJobs, getPhotoSet, products } from "@/lib/mock-data";
import { useLang } from "@/lib/lang";

export default function StatusPage() {
  const { tr } = useLang();
  const s = tr.status;

  const product = products[1];
  const job = generationJobs.find((item) => item.productId === product.id);
  const photoSet = getPhotoSet(product.id);
  const preflightChecks = photoSet ? runPhotoPreflight(photoSet) : [];

  function getDetail(index: number): string {
    const d = s.stageDetails;
    if (index === 0) {
      const detail = d[0];
      return typeof detail === "function" ? detail(product.photoCount, photoSet?.id ?? s.photoSetFallback) : detail;
    }
    if (index === 1) {
      const detail = d[1];
      return typeof detail === "function"
        ? detail(preflightChecks.filter((c) => c.status === "pass").length, preflightChecks.length)
        : detail;
    }
    if (index === 2) {
      const detail = d[2];
      return typeof detail === "function"
        ? detail(job?.provider ?? "meshy", job?.providerStatus ?? job?.status ?? "queued")
        : detail;
    }
    return d[index] as string;
  }

  return (
    <AppShell>
      <header>
        <p className="eyebrow">{s.eyebrow}</p>
        <h1>{product.name}</h1>
        <p className="muted">{s.subtitle}</p>
      </header>

      <section className="grid two">
        <div className="panel timeline">
          {pipelineStages.map((stage, index) => {
            const className = index < 2 ? "step done" : index === 2 ? "step active" : "step";
            return (
              <div className={className} key={stage}>
                <h3>{stage}</h3>
                <p className="muted">{getDetail(index)}</p>
              </div>
            );
          })}
        </div>

        <aside className="panel stack">
          <h2>{s.fallbackHeading}</h2>
          <p className="muted">{s.fallbackDesc}</p>
          <span className="badge warning">{s.generationRunning}</span>
          <span className="badge neutral">{s.providerJob} {job?.id}</span>
          <span className="badge success">{job?.fallbackAvailable ? s.tripoAvailable : s.fallbackLocked}</span>
          <Link className="button secondary" href="/preview">
            {s.viewLastModel}
          </Link>
        </aside>
      </section>
    </AppShell>
  );
}

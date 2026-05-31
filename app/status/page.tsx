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
    if (index === 0) return (d[0] as Function)(product.photoCount, photoSet?.id ?? s.photoSetFallback);
    if (index === 1) return (d[1] as Function)(preflightChecks.filter((c) => c.status === "pass").length, preflightChecks.length);
    if (index === 2) return (d[2] as Function)(job?.provider ?? "meshy", job?.providerStatus ?? job?.status ?? "queued");
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
          <span className="badge neutral">{s.providerJob} {job?.providerJobId}</span>
          <span className="badge success">{job?.fallbackAvailable ? s.tripoAvailable : s.fallbackLocked}</span>
          <Link className="button secondary" href="/preview">
            {s.viewLastModel}
          </Link>
        </aside>
      </section>
    </AppShell>
  );
}

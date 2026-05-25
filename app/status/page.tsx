import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { pipelineStages, runPhotoPreflight } from "@/lib/generation-pipeline";
import { generationJobs, getPhotoSet, products } from "@/lib/mock-data";

export default function StatusPage() {
  const product = products[1];
  const job = generationJobs.find((item) => item.productId === product.id);
  const photoSet = getPhotoSet(product.id);
  const preflightChecks = photoSet ? runPhotoPreflight(photoSet) : [];

  return (
    <AppShell>
      <header>
        <p className="eyebrow">Generation status</p>
        <h1>{product.name}</h1>
        <p className="muted">Meshy is the primary provider. Tripo is reserved as a manual fallback.</p>
      </header>

      <section className="grid two">
        <div className="panel timeline">
          {pipelineStages.map((stage, index) => {
            const className = index < 2 ? "step done" : index === 2 ? "step active" : "step";
            const detail =
              index === 0
                ? `${product.photoCount} photos stored in ${photoSet?.id ?? "the active photo set"}.`
                : index === 1
                  ? `${preflightChecks.filter((check) => check.status === "pass").length}/${preflightChecks.length} checks passed before provider submission.`
                  : index === 2
                    ? `Provider: ${job?.provider ?? "meshy"}. Status: ${job?.providerStatus ?? job?.status ?? "queued"}.`
                    : index === 3
                      ? "Raw provider output is stored before GLB, USDZ, poster, thumbnail, and metadata packaging."
                      : index === 4
                        ? "The app checks model load, size, dimensions, textures, preview render, and AR package readiness."
                        : "A reviewer approves, rejects, or requests regeneration.";

            return (
              <div className={className} key={stage}>
                <h3>{stage}</h3>
                <p className="muted">{detail}</p>
              </div>
            );
          })}
        </div>

        <aside className="panel stack">
          <h2>Fallback control</h2>
          <p className="muted">
            Admins can retry with Tripo if Meshy fails or returns unusable geometry. This is intentionally not exposed
            to merchants.
          </p>
          <span className="badge warning">Generation running</span>
          <span className="badge neutral">Provider job {job?.providerJobId}</span>
          <span className="badge success">{job?.fallbackAvailable ? "Tripo fallback available" : "Fallback locked"}</span>
          <Link className="button secondary" href="/preview">
            View last successful model
          </Link>
        </aside>
      </section>
    </AppShell>
  );
}

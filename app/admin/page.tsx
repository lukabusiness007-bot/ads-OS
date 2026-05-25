import { AppShell } from "@/components/AppShell";
import { ViewerMock } from "@/components/ViewerMock";
import { runModelPackageChecks } from "@/lib/generation-pipeline";
import { getReviewQueue } from "@/lib/mock-data";

export default function AdminReviewPage() {
  const queue = getReviewQueue();

  return (
    <AppShell>
      <header>
        <p className="eyebrow">Internal admin review</p>
        <h1>Review generated models</h1>
        <p className="muted">Approve, reject, or request regeneration before a hosted page can publish.</p>
      </header>

      <section className="grid two">
        {queue.map((item) => (
          <article className="panel stack" key={item.id}>
            <div className="row">
              <div>
                <h2>{item.product?.name}</h2>
                <p className="muted">{item.product?.customerUrl}</p>
              </div>
              <span className="badge warning">{item.status}</span>
            </div>
            <ViewerMock />
            <ul className="checklist">
              {item.product?.modelAsset &&
                runModelPackageChecks(item.product.modelAsset).map((check) => (
                  <li key={check.id}>
                    <span className="checkDot" />
                    <span>
                      {check.label}: {check.status}
                    </span>
                  </li>
                ))}
              <li>
                <span className="checkDot" />
                <span>Resembles product</span>
              </li>
              <li>
                <span className="checkDot" />
                <span>Orientation correct</span>
              </li>
              <li>
                <span className="checkDot" />
                <span>Scale plausible</span>
              </li>
              <li>
                <span className="checkDot" />
                <span>AR launch test pending</span>
              </li>
            </ul>
            <div className="row">
              <button className="button accent" type="button">
                Approve
              </button>
              <button className="button secondary" type="button">
                Request regeneration
              </button>
              <button className="button secondary" type="button">
                Reject
              </button>
            </div>
          </article>
        ))}

        <aside className="panel stack">
          <h2>Review rules</h2>
          <p className="muted">
            Approval verifies visual sales quality, not CAD precision. Failed models stay private and cannot be opened
            at a public URL.
          </p>
          <span className="badge success">Manual gate active</span>
        </aside>
      </section>
    </AppShell>
  );
}

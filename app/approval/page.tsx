import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { products, reviews } from "@/lib/mock-data";

export default function ApprovalPage() {
  const product = products[0];
  const review = reviews[0];

  return (
    <AppShell>
      <header>
        <p className="eyebrow">Approval status</p>
        <h1>Manual review controls publishing</h1>
        <p className="muted">No public hosted page goes live until the product model is approved.</p>
      </header>

      <section className="grid two">
        <div className="panel stack">
          <div className="row">
            <div>
              <h2>{product.name}</h2>
              <p className="muted">{product.description}</p>
            </div>
            <StatusBadge status={product.status} />
          </div>
          <ul className="checklist">
            <li>
              <span className="checkDot" />
              <span>Model resembles product.</span>
            </li>
            <li>
              <span className="checkDot" />
              <span>Orientation and scale are reasonable.</span>
            </li>
            <li>
              <span className="checkDot" />
              <span>Textures and geometry are acceptable.</span>
            </li>
            <li>
              <span className="checkDot" />
              <span>Public preview loads before publishing.</span>
            </li>
          </ul>
          <p className="muted">Reviewer note: {review.notes}</p>
        </div>

        <aside className="panel stack">
          <h2>Merchant status</h2>
          <p className="muted">
            Merchants see a simple review status. Internal rejection reasons can be translated into clear regeneration
            steps.
          </p>
          <span className="badge warning">Awaiting review</span>
          <Link className="button secondary" href="/hosted-page">
            Hosted page settings
          </Link>
        </aside>
      </section>
    </AppShell>
  );
}

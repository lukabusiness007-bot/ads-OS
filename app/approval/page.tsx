"use client"

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { products, reviews } from "@/lib/mock-data";
import { useLang } from "@/lib/lang";

export default function ApprovalPage() {
  const { tr } = useLang();
  const ap = tr.approval;

  const product = products[0];
  const review = reviews[0];

  return (
    <AppShell>
      <header>
        <p className="eyebrow">{ap.eyebrow}</p>
        <h1>{ap.heading}</h1>
        <p className="muted">{ap.subtitle}</p>
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
            {ap.checks.map((check) => (
              <li key={check}>
                <span className="checkDot" />
                <span>{check}</span>
              </li>
            ))}
          </ul>
          <p className="muted">{ap.reviewerNote} {review.notes}</p>
        </div>

        <aside className="panel stack">
          <h2>{ap.merchantStatus}</h2>
          <p className="muted">{ap.merchantDesc}</p>
          <span className="badge warning">{ap.awaitingReview}</span>
          <Link className="button secondary" href="/hosted-page">
            {ap.hostedSettings}
          </Link>
        </aside>
      </section>
    </AppShell>
  );
}

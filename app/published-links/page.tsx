"use client"

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";
import { products } from "@/lib/mock-data";
import { useLang } from "@/lib/lang";

export default function PublishedLinksPage() {
  const { tr } = useLang();
  const p = tr.publishedLinks;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">{p.eyebrow}</p>
          <h1>{p.heading}</h1>
          <p className="muted">{p.subtitle}</p>
        </div>
        <Link className="button accent" href="/create">
          {p.createBtn}
        </Link>
      </header>

      <section className="panel linkGrid">
        {products.map((product) => (
          <article className="publishedItem" key={product.id}>
            <div>
              <h2>{product.name}</h2>
              <p className="muted">{product.customerUrl}</p>
              <div className="assetGrid">
                <StatusBadge status={product.status} />
                <span className={product.hostedPage?.status === "published" ? "badge success" : "badge neutral"}>
                  {product.hostedPage?.status === "published" ? p.verifiedLive : p.notPublished}
                </span>
              </div>
            </div>
            <div className="rightStack">
              <span className="sectionLabel">{p.hostedLink}</span>
              {product.hostedPage?.status === "published" ? (
                <>
                  <Link className="textLink" href={product.hostedPage.publicUrl}>
                    {product.hostedPage.publicUrl}
                  </Link>
                  <div className="assetGrid">
                    <Link className="button secondary sm" href={product.hostedPage.publicUrl}>
                      {p.preview}
                    </Link>
                    <CopyButton value={product.hostedPage.publicUrl} />
                  </div>
                </>
              ) : (
                <span className="muted">{p.availableAfter}</span>
              )}
              <span className="muted">{p.ctaDestination} {product.customerUrl}</span>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

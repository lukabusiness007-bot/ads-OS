"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CopyButton } from "@/components/CopyButton"
import { StatusBadge } from "@/components/StatusBadge"
import { useLang } from "@/lib/lang"
import type { DashboardData } from "@/lib/supabase/data"
import type { Product, ProductStatus } from "@/lib/types"

const COMPLETE_STATUSES: ProductStatus[] = ["awaiting_review", "approved", "published", "unpublished"]

/** Build the iframe snippet a merchant pastes into their own store. */
function embedSnippet(origin: string, hostedSlug: string): string {
  return (
    `<iframe src="${origin}/embed/${hostedSlug}" width="100%" height="480" ` +
    `frameborder="0" allow="xr-spatial-tracking; fullscreen" loading="lazy" ` +
    `style="border:0;border-radius:16px;"></iframe>`
  )
}

export function PublishedLinksClient({ data }: { data: DashboardData }) {
  const { tr } = useLang()
  const pl = tr.publishedLinks

  // Snippets need an absolute origin. Prefer the configured public site URL;
  // fall back to the current origin once mounted (avoids an SSR/CSR mismatch).
  const [origin, setOrigin] = useState(
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")
  )
  useEffect(() => {
    if (!origin) {
      setOrigin(window.location.origin)
    }
  }, [origin])

  const products = data.products.filter((p) => COMPLETE_STATUSES.includes(p.status))

  // hostedPage.slug is "{merchant}/{product}"; the embed route mirrors it.
  function hostedSlugFor(product: Product): string {
    return product.hostedPage?.slug ?? ""
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">{pl.eyebrow}</p>
          <h1>{pl.heading}</h1>
          <p className="muted">{pl.subtitle}</p>
        </div>
        <Link className="button accent" href="/create">
          {pl.createBtn}
        </Link>
      </header>

      <section className="panel linkGrid">
        {products.length === 0 ? (
          <div className="emptyTableState">
            <strong>{tr.dashboard.emptyProductsTitle}</strong>
            <p className="muted">{tr.dashboard.emptyProductsDesc}</p>
          </div>
        ) : (
          products.map((product) => (
            <article className="publishedItem" key={product.id}>
              <div>
                <h2>{product.name}</h2>
                <p className="muted">{product.customerUrl}</p>
                <div className="assetGrid">
                  <StatusBadge status={product.status} />
                  <span className={product.hostedPage?.status === "published" ? "badge success" : "badge neutral"}>
                    {product.hostedPage?.status === "published" ? pl.verifiedLive : pl.notPublished}
                  </span>
                </div>
              </div>
              <div className="rightStack">
                <span className="sectionLabel">{pl.hostedLink}</span>
                {product.hostedPage?.status === "published" ? (
                  <>
                    <Link className="textLink" href={product.hostedPage.publicUrl}>
                      {product.hostedPage.publicUrl}
                    </Link>
                    <div className="assetGrid">
                      <CopyButton
                        value={product.hostedPage.publicUrl}
                        className="button accent"
                        label={tr.table.copyLink}
                      />
                      <Link
                        className="button ghost"
                        href={product.hostedPage.publicUrl}
                        target="_blank"
                        rel="noopener"
                      >
                        {pl.preview} ↗
                      </Link>
                    </div>
                    <div className="embedSnippetBlock">
                      <span className="sectionLabel">{pl.embedHeading}</span>
                      <p className="muted">{pl.embedHint}</p>
                      <code className="embedSnippet">
                        {embedSnippet(origin, hostedSlugFor(product))}
                      </code>
                      <CopyButton
                        value={embedSnippet(origin, hostedSlugFor(product))}
                        className="button secondary sm"
                        label={pl.copyEmbed}
                      />
                    </div>
                  </>
                ) : (
                  <span className="muted">{pl.availableAfter}</span>
                )}
                <span className="muted">{pl.ctaDestination} {product.customerUrl}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  )
}

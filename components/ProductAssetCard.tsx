"use client"

import Link from "next/link"
import { Box } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { CopyButton } from "@/components/CopyButton"
import type { Product } from "@/lib/types"

type ProductAssetCardProps = {
  product: Product
}

export function ProductAssetCard({ product }: ProductAssetCardProps) {
  const poster =
    product.modelAsset?.posterUrl ??
    product.modelAsset?.thumbnailUrl ??
    null

  const hasEngagement =
    (product.analytics?.arButtonClicks ?? 0) > 0 ||
    (product.analytics?.ctaClicks ?? 0) > 0

  return (
    <article className="productCard">
      <div className="productCardPoster">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="productCardPosterImg"
            src={poster}
            alt={`${product.name} 3D model poster`}
          />
        ) : (
          <div className="productCardPosterPlaceholder" aria-hidden="true">
            <Box size={40} strokeWidth={1.5} />
          </div>
        )}
        <span className="productCardStatusPin">
          <StatusBadge status={product.status} />
        </span>
      </div>

      <div className="productCardBody">
        <div>
          <h3 className="productCardName" title={product.name}>{product.name}</h3>
          <p className="productCardCategory">
            {product.category.replace("_", " ")} &middot; {product.photoCount} photo{product.photoCount !== 1 ? "s" : ""}
          </p>
        </div>

        {hasEngagement && (
          <dl className="productCardStats">
            <div className="productCardStat">
              <dt>AR views</dt>
              <dd>{product.analytics?.arButtonClicks ?? 0}</dd>
            </div>
            <div className="productCardStat">
              <dt>Store clicks</dt>
              <dd>{product.analytics?.ctaClicks ?? 0}</dd>
            </div>
          </dl>
        )}

        <div className="productCardActions">
          <PrimaryAction product={product} />
        </div>
      </div>
    </article>
  )
}

function PrimaryAction({ product }: { product: Product }) {
  if (product.status === "generating") {
    return (
      <Link className="button secondary sm" href="/status">
        View progress
      </Link>
    )
  }

  if (product.status === "awaiting_review") {
    return (
      <Link className="button accent sm" href="/approval">
        Review model
      </Link>
    )
  }

  if (product.status === "approved") {
    return (
      <Link className="button accent sm" href="/hosted-page">
        Publish
      </Link>
    )
  }

  if (product.status === "published" && product.hostedPage?.publicUrl) {
    return (
      <>
        <CopyButton
          value={product.hostedPage.publicUrl}
          label="Copy live link"
          className="button accent sm"
        />
        <a
          className="button secondary sm"
          href={product.hostedPage.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open
        </a>
      </>
    )
  }

  if (product.status === "generation_failed" || product.status === "rejected") {
    return (
      <Link className="button secondary sm" href="/create">
        Regenerate
      </Link>
    )
  }

  return (
    <Link className="button secondary sm" href="/create">
      Continue
    </Link>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Box, Trash2 } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import { CopyButton } from "@/components/CopyButton"
import { useLang } from "@/lib/lang"
import type { Product, ProductStatus } from "@/lib/types"

const DELETABLE_STATUSES: ProductStatus[] = ["draft", "photos_uploaded", "generation_failed", "rejected"]

type ProductAssetCardProps = {
  product: Product
}

export function ProductAssetCard({ product }: ProductAssetCardProps) {
  const router = useRouter()
  const { tr } = useLang()
  const pc = tr.productCard

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const poster = product.modelAsset?.posterUrl ?? product.modelAsset?.thumbnailUrl ?? null
  const hasEngagement =
    (product.analytics?.arButtonClicks ?? 0) > 0 || (product.analytics?.ctaClicks ?? 0) > 0
  const isDeletable = DELETABLE_STATUSES.includes(product.status)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    setDeleteError("")
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { errorMessage?: string }).errorMessage ?? "Greška pri brisanju.")
      }
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Greška.")
      setDeleting(false)
    }
  }

  return (
    <article
      className="productCard"
      style={{ cursor: "pointer", position: "relative" }}
      onClick={() => router.push(`/products/${product.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push(`/products/${product.id}`)
      }}
      aria-label={product.name}
    >
      <div className="productCardPoster">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="productCardPosterImg" src={poster} alt={`${product.name} 3D model poster`} />
        ) : (
          <div className="productCardPosterPlaceholder" aria-hidden="true">
            <Box size={40} strokeWidth={1.5} />
          </div>
        )}
        <span className="productCardStatusPin">
          <StatusBadge status={product.status} />
        </span>

        {isDeletable && !confirmDelete && (
          <button
            className="productCardDeleteBtn"
            type="button"
            aria-label={pc.delete}
            title={pc.delete}
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
          >
            <Trash2 size={13} aria-hidden />
          </button>
        )}
      </div>

      <div className="productCardBody">
        <div>
          <h3 className="productCardName" title={product.name}>{product.name}</h3>
          <p className="productCardCategory">
            {product.category.replace("_", " ")} &middot; {product.photoCount} {pc.photos}
          </p>
        </div>

        {hasEngagement && (
          <dl className="productCardStats">
            <div className="productCardStat">
              <dt>{pc.arViews}</dt>
              <dd>{product.analytics?.arButtonClicks ?? 0}</dd>
            </div>
            <div className="productCardStat">
              <dt>{pc.storeClicks}</dt>
              <dd>{product.analytics?.ctaClicks ?? 0}</dd>
            </div>
          </dl>
        )}

        {confirmDelete ? (
          <div className="productCardConfirm" onClick={(e) => e.stopPropagation()}>
            <p className="productCardConfirmText">{pc.deleteConfirm}</p>
            {deleteError && <p className="productCardConfirmError">{deleteError}</p>}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="button sm"
                style={{ background: "#dc2626", borderColor: "#dc2626", color: "#fff", flex: 1 }}
                type="button"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? pc.deleting : pc.delete}
              </button>
              <button
                className="button secondary sm"
                type="button"
                disabled={deleting}
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); setDeleteError("") }}
              >
                {pc.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="productCardActions">
            <PrimaryAction product={product} pc={pc} />
          </div>
        )}
      </div>
    </article>
  )
}

type PcLabels = {
  viewProgress: string
  reviewModel: string
  publish: string
  copyLiveLink: string
  open: string
  regenerate: string
  continue_: string
}

function PrimaryAction({ product, pc }: { product: Product; pc: PcLabels }) {
  if (product.status === "generating") {
    return (
      <Link
        className="button secondary sm"
        href="/status"
        onClick={(e) => e.stopPropagation()}
      >
        {pc.viewProgress}
      </Link>
    )
  }

  if (product.status === "awaiting_review") {
    return (
      <Link
        className="button accent sm"
        href="/approval"
        onClick={(e) => e.stopPropagation()}
      >
        {pc.reviewModel}
      </Link>
    )
  }

  if (product.status === "approved") {
    return (
      <Link
        className="button accent sm"
        href="/hosted-page"
        onClick={(e) => e.stopPropagation()}
      >
        {pc.publish}
      </Link>
    )
  }

  if (product.status === "published" && product.hostedPage?.publicUrl) {
    return (
      <>
        <span onClick={(e) => e.stopPropagation()}>
          <CopyButton
            value={product.hostedPage.publicUrl}
            label={pc.copyLiveLink}
            className="button accent sm"
          />
        </span>
        <a
          className="button secondary sm"
          href={product.hostedPage.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {pc.open}
        </a>
      </>
    )
  }

  if (product.status === "generation_failed" || product.status === "rejected") {
    return (
      <Link
        className="button secondary sm"
        href="/create"
        onClick={(e) => e.stopPropagation()}
      >
        {pc.regenerate}
      </Link>
    )
  }

  return (
    <Link
      className="button secondary sm"
      href="/create"
      onClick={(e) => e.stopPropagation()}
    >
      {pc.continue_}
    </Link>
  )
}

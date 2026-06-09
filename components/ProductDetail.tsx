"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ModelViewer } from "@/components/ModelViewer"
import { StatusBadge } from "@/components/StatusBadge"
import { CopyButton } from "@/components/CopyButton"
import { useLang } from "@/lib/lang"
import { formatMeters } from "@/lib/ui"
import type { Product, ProductCategory, ProductStatus } from "@/lib/types"

const DELETABLE_STATUSES: ProductStatus[] = [
  "draft",
  "photos_uploaded",
  "generation_failed",
  "rejected"
]

const CATEGORIES: ProductCategory[] = [
  "chair",
  "table",
  "sofa",
  "lamp",
  "shelf",
  "small_decor"
]

function cmToMeters(value: string): number {
  const cm = parseFloat(value.replace(",", "."))
  return isFinite(cm) ? +(cm / 100).toFixed(3) : 0
}

function metersToCm(meters: number): string {
  return meters > 0 ? String(Math.round(meters * 100)) : ""
}

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const { tr } = useLang()
  const pd = tr.productDetail

  const [name, setName] = useState(product.name)
  const [category, setCategory] = useState<ProductCategory>(product.category)
  const [description, setDescription] = useState(product.description ?? "")
  const [width, setWidth] = useState(metersToCm(product.dimensions.width))
  const [height, setHeight] = useState(metersToCm(product.dimensions.height))
  const [depth, setDepth] = useState(metersToCm(product.dimensions.depth))
  const [customerUrl, setCustomerUrl] = useState(product.customerUrl)
  const [price, setPrice] = useState(product.price ?? "")

  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState("")

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const isDeletable = DELETABLE_STATUSES.includes(product.status)
  const isPublished = product.hostedPage?.status === "published"

  async function handleSave() {
    setSaving(true)
    setSaveStatus("idle")
    setSaveError("")

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || product.name,
          category,
          description: description.trim() || undefined,
          customerUrl: customerUrl.trim() || undefined,
          price: price.trim() || undefined,
          dimensions: {
            width: cmToMeters(width),
            height: cmToMeters(height),
            depth: cmToMeters(depth)
          }
        })
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { errorMessage?: string }
        throw new Error(json.errorMessage ?? pd.saveError)
      }

      setSaveStatus("saved")
      router.refresh()
      window.setTimeout(() => setSaveStatus("idle"), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : pd.saveError)
      setSaveStatus("error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError("")

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { errorMessage?: string }
        throw new Error(json.errorMessage ?? pd.deleteError)
      }
      router.push("/dashboard")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : pd.deleteError)
      setDeleting(false)
    }
  }

  const hasDimensions =
    product.dimensions.width > 0 ||
    product.dimensions.height > 0 ||
    product.dimensions.depth > 0

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">{pd.eyebrow}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>{product.name}</h1>
            <StatusBadge status={product.status} />
          </div>
          <Link
            href="/dashboard"
            style={{ color: "var(--muted)", fontSize: 13, display: "inline-block", marginTop: 4 }}
          >
            {pd.backToProducts}
          </Link>
        </div>
      </header>

      <section className="grid two" style={{ alignItems: "start" }}>
        {/* Left: model viewer + asset badges + hosted link */}
        <div className="panel stack">
          <h2 style={{ marginBottom: 0 }}>{pd.previewSection}</h2>

          <ModelViewer
            asset={product.modelAsset}
            alt={`${product.name} 3D model`}
            arShareUrl={isPublished ? product.hostedPage!.publicUrl : null}
          />

          {product.modelAsset && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className={`badge ${product.modelAsset.glbUrl ? "success" : "neutral"}`}>
                {product.modelAsset.glbUrl ? pd.glbReady : "GLB —"}
              </span>
              <span className={`badge ${product.modelAsset.usdzUrl ? "success" : "neutral"}`}>
                {product.modelAsset.usdzUrl ? pd.usdzReady : "USDZ —"}
              </span>
              <span className={`badge ${product.modelAsset.posterUrl ? "success" : "neutral"}`}>
                {product.modelAsset.posterUrl ? pd.posterReady : "Poster —"}
              </span>
            </div>
          )}

          {/* Hosted link */}
          <div>
            <p className="sectionLabel" style={{ marginBottom: 6 }}>{pd.hostedLink}</p>
            {isPublished ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <CopyButton
                  value={product.hostedPage!.publicUrl}
                  label={tr.table.copyLink}
                  className="button accent sm"
                />
                <a
                  className="button secondary sm"
                  href={product.hostedPage!.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tr.productCard.open} ↗
                </a>
              </div>
            ) : (
              <span className="badge neutral">{pd.notPublished}</span>
            )}
          </div>

          {/* Analytics mini */}
          {product.analytics && (
            <div>
              <p className="sectionLabel" style={{ marginBottom: 8 }}>{pd.analytics}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="badge neutral">{pd.pageViews}: {product.analytics.pageViews}</span>
                <span className="badge neutral">{pd.arClicks}: {product.analytics.arButtonClicks}</span>
                <span className="badge neutral">{pd.storeClicks}: {product.analytics.ctaClicks}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: info + edit form */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Info */}
          <article className="panel stack">
            <h2 style={{ marginBottom: 0 }}>{pd.infoSection}</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="badge neutral">
                {pd.category}: {product.category.replace("_", " ")}
              </span>
              <span className="badge neutral">
                {pd.photos}: {product.photoCount}
              </span>
            </div>
            {hasDimensions && (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                {formatMeters(product.dimensions.width)} ×{" "}
                {formatMeters(product.dimensions.height)} ×{" "}
                {formatMeters(product.dimensions.depth)}
              </p>
            )}
            <div>
              <p className="sectionLabel" style={{ marginBottom: 6 }}>{pd.statusSection}</p>
              <StatusBadge status={product.status} />
            </div>
          </article>

          {/* Edit form */}
          <article className="panel stack">
            <div>
              <h2 style={{ marginBottom: 4 }}>{pd.editSection}</h2>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>{pd.editDesc}</p>
            </div>

            <div className="field">
              <label htmlFor="pd-name">{pd.productName}</label>
              <input
                id="pd-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="pd-category">{pd.category}</label>
              <select
                id="pd-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="pd-description">{pd.description}</label>
              <textarea
                id="pd-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <p
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 7,
                  margin: "0 0 7px"
                }}
              >
                {pd.dimensionsHeading}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { id: "pd-w", label: pd.widthLabel, value: width, set: setWidth },
                  { id: "pd-h", label: pd.heightLabel, value: height, set: setHeight },
                  { id: "pd-d", label: pd.depthLabel, value: depth, set: setDepth }
                ].map(({ id, label, value, set }) => (
                  <div className="field" key={id}>
                    <label htmlFor={id} style={{ fontSize: 12 }}>{label}</label>
                    <input
                      id={id}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="pd-url">{pd.storeUrl}</label>
              <input
                id="pd-url"
                type="url"
                value={customerUrl}
                onChange={(e) => setCustomerUrl(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="pd-price">{pd.price}</label>
              <input
                id="pd-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="npr. 89 EUR"
              />
            </div>

            {saveStatus === "error" && (
              <div className="assumptionNote">{saveError}</div>
            )}

            <button
              className="button accent"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? pd.saving : saveStatus === "saved" ? pd.saved : pd.saveChanges}
            </button>

            {isDeletable && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                {confirmDelete ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#dc2626" }}>
                      {pd.deleteConfirm}
                    </p>
                    {deleteError && (
                      <p style={{ color: "#dc2626", fontSize: 12, margin: 0 }}>{deleteError}</p>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="button sm"
                        style={{
                          background: "#dc2626",
                          borderColor: "#dc2626",
                          color: "#fff",
                          flex: 1
                        }}
                        type="button"
                        disabled={deleting}
                        onClick={handleDelete}
                      >
                        {deleting ? pd.deleting : pd.deleteModel}
                      </button>
                      <button
                        className="button secondary sm"
                        type="button"
                        disabled={deleting}
                        onClick={() => {
                          setConfirmDelete(false)
                          setDeleteError("")
                        }}
                      >
                        {pd.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="button ghost"
                    type="button"
                    style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                    onClick={() => setConfirmDelete(true)}
                  >
                    {pd.deleteModel}
                  </button>
                )}
              </div>
            )}
          </article>
        </div>
      </section>
    </>
  )
}

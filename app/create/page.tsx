"use client"

import type { ChangeEvent } from "react"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { Upload, X, Check, Loader2, Box } from "lucide-react"
import { AppShell } from "@/components/AppShell"
import { ModelViewer } from "@/components/ModelViewer"
import { Reveal, RevealStagger } from "@/components/Reveal"
import { PhotoLightbox } from "@/components/PhotoLightbox"
import { useGenerationStatus } from "@/hooks/useGenerationStatus"
import {
  prepareGenerationPhotos,
  type PreparedGenerationPhoto
} from "@/lib/generation-upload-client"
import {
  MAX_GENERATION_PHOTO_BYTES_TOTAL,
  MAX_GENERATION_PHOTO_SIZE_BYTES,
  MIN_GENERATION_PHOTOS,
  MAX_GENERATION_PHOTOS,
  SUPPORTED_GENERATION_IMAGE_TYPES,
  TARGET_GENERATION_PHOTO_BYTES_TOTAL,
  TARGET_GENERATION_PHOTO_SIZE_BYTES,
  formatMegabytes
} from "@/lib/generation-upload"
import {
  GENERATED_PRODUCT_STORAGE_KEY,
  type StoredGeneratedProduct
} from "@/lib/generated-product-storage"
import { organization } from "@/lib/mock-data"
import type {
  CreateGenerationUploadsResponse,
  GenerationPhotoContentType,
  ProductCategory,
  StartGenerationRequest,
  StartGenerationResponse
} from "@/lib/types"
import { runModelPackageChecks } from "@/lib/generation-pipeline"

const CATEGORIES: ProductCategory[] = ["chair", "table", "sofa", "lamp", "shelf", "small_decor"]

type UploadPhase =
  | "idle"
  | "preparing"
  | "ready"
  | "uploading"
  | "starting"
  | "generating"
  | "revealed"
  | "error"

export default function CreateProductPage() {
  // File state
  const [photos, setPhotos] = useState<File[]>([])
  const [preparedPhotos, setPreparedPhotos] = useState<PreparedGenerationPhoto[]>([])
  const [photoObjectUrls, setPhotoObjectUrls] = useState<string[]>([])

  // UI state
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle")
  const [isDragOver, setIsDragOver] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Progress
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preparationProgress, setPreparationProgress] = useState({
    completed: 0,
    total: 0,
    currentFileName: ""
  })

  // Generation job
  const [generationJob, setGenerationJob] = useState<{
    productId: string
    taskId: string
  } | null>(null)
  const [storedProductData, setStoredProductData] = useState<StoredGeneratedProduct | null>(null)

  // Quick name (pre-upload)
  const [productNameInput, setProductNameInput] = useState("")

  // Deferred metadata (post-reveal)
  const [metaName, setMetaName] = useState("")
  const [metaCategory, setMetaCategory] = useState<ProductCategory>("chair")
  const [metaWidth, setMetaWidth] = useState("")
  const [metaHeight, setMetaHeight] = useState("")
  const [metaDepth, setMetaDepth] = useState("")
  const [metaUrl, setMetaUrl] = useState("")
  const [metaPrice, setMetaPrice] = useState("")
  const [metaEnhancement, setMetaEnhancement] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectionIdRef = useRef(0)

  // Generation polling
  const { statusPayload, isPolling, pollError } = useGenerationStatus(
    generationJob?.productId ?? "",
    generationJob?.taskId ?? ""
  )

  // Resume in-flight job from localStorage on mount
  useEffect(() => {
    const tid = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(GENERATED_PRODUCT_STORAGE_KEY)
        if (!raw) return
        const stored = JSON.parse(raw) as StoredGeneratedProduct
        if (stored.status === "succeeded" && stored.asset && stored.productId) {
          setStoredProductData(stored)
          setGenerationJob({ productId: stored.productId, taskId: stored.taskId })
          setUploadPhase("revealed")
          initMetaFromStored(stored)
        } else if (
          (stored.status === "queued" || stored.status === "running") &&
          stored.productId &&
          stored.taskId
        ) {
          setStoredProductData(stored)
          setGenerationJob({ productId: stored.productId, taskId: stored.taskId })
          setUploadPhase("generating")
          initMetaFromStored(stored)
        }
      } catch {
        // ignore corrupt storage
      }
    }, 0)
    return () => window.clearTimeout(tid)
  }, [])

  // React to status updates from hook
  useEffect(() => {
    if (statusPayload?.status === "succeeded" && uploadPhase === "generating") {
      setUploadPhase("revealed")
      setStoredProductData((prev) => {
        if (!prev) return prev
        const next: StoredGeneratedProduct = {
          ...prev,
          status: "succeeded",
          asset: statusPayload.asset ?? prev.asset,
          progress: 100,
          updatedAt: new Date().toISOString()
        }
        window.localStorage.setItem(GENERATED_PRODUCT_STORAGE_KEY, JSON.stringify(next))
        return next
      })
    } else if (statusPayload?.status === "failed" && uploadPhase === "generating") {
      setUploadPhase("error")
      setErrorMessage(statusPayload.message ?? "Generation failed. Please try again with different photos.")
    }
  }, [statusPayload, uploadPhase])

  // Create / revoke object URLs when photos change
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f))
    setPhotoObjectUrls(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [photos])

  function initMetaFromStored(stored: StoredGeneratedProduct) {
    setMetaName(stored.name ?? "")
    setMetaCategory(stored.category ?? "chair")
    setMetaWidth(stored.dimensions?.width ? String(Math.round(stored.dimensions.width * 100)) : "")
    setMetaHeight(stored.dimensions?.height ? String(Math.round(stored.dimensions.height * 100)) : "")
    setMetaDepth(stored.dimensions?.depth ? String(Math.round(stored.dimensions.depth * 100)) : "")
    setMetaUrl(stored.customerUrl && stored.customerUrl !== "#" ? stored.customerUrl : "")
    setMetaPrice(stored.price ?? "")
  }

  async function processSelectedFiles(files: File[]) {
    const selectionId = selectionIdRef.current + 1
    selectionIdRef.current = selectionId

    const validationError = validatePhotoSelection(files)

    setPhotos(files)
    setPreparedPhotos([])
    setUploadProgress(0)
    setPreparationProgress({ completed: 0, total: files.length, currentFileName: "" })

    if (validationError) {
      setErrorMessage(validationError)
      setPhotos([])
      setUploadPhase("idle")
      return
    }

    setErrorMessage("")
    setUploadPhase("preparing")
    await waitForNextPaint()

    try {
      const prepared = await prepareGenerationPhotos(files, {
        targetBytes: TARGET_GENERATION_PHOTO_SIZE_BYTES,
        onProgress: (progress) => {
          if (selectionIdRef.current !== selectionId) return
          setPreparationProgress(progress)
        }
      })

      if (selectionIdRef.current !== selectionId) return

      const preparedError = validatePreparedPhotos(prepared)
      if (preparedError) {
        setErrorMessage(preparedError)
        setPreparedPhotos([])
        setUploadPhase("idle")
        return
      }

      setPreparedPhotos(prepared)
      setUploadPhase("ready")
    } catch (error) {
      if (selectionIdRef.current !== selectionId) return
      setPreparedPhotos([])
      setUploadPhase("idle")
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not prepare these photos. Try clearer originals with fewer pixels."
      )
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) await processSelectedFiles(files)
    // reset so the same files can be re-selected
    event.target.value = ""
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    // only clear if we've left the dropzone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(isSupportedPhoto)
    if (files.length > 0) await processSelectedFiles(files)
  }

  function removePhoto(index: number) {
    const newPhotos = photos.filter((_, i) => i !== index)
    if (newPhotos.length === 0) {
      setPhotos([])
      setPreparedPhotos([])
      setUploadPhase("idle")
    } else {
      void processSelectedFiles(newPhotos)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError =
      validatePhotoSelection(photos) || validatePreparedPhotos(preparedPhotos)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")
    setUploadProgress(0)
    setUploadPhase("uploading")

    try {
      const name = productNameInput.trim() || "My Product"
      const uploadTargets = await createGenerationUploads(name, preparedPhotos)
      await uploadPreparedPhotos(preparedPhotos, uploadTargets.uploads, setUploadProgress)

      setUploadPhase("starting")
      const response = await startGenerationRequest({
        productId: uploadTargets.productId,
        photos: uploadTargets.uploads.map(({ key, fileName, contentType, size }) => ({
          key,
          fileName,
          contentType,
          size
        })),
        imageEnhancement: metaEnhancement
      })
      const payload = readStartGenerationPayload(response.body, response.status)

      if (response.status < 200 || response.status >= 300 || !payload.productId || !payload.taskId) {
        throw new Error(payload.errorMessage ?? "Generation could not start.")
      }

      // Store in localStorage (enables resume on refresh)
      const stored = createStoredProduct(name, payload.productId, payload.taskId, preparedPhotos.length)
      window.localStorage.setItem(GENERATED_PRODUCT_STORAGE_KEY, JSON.stringify(stored))

      setStoredProductData(stored)
      setMetaName(name)
      setGenerationJob({ productId: payload.productId, taskId: payload.taskId })
      setUploadPhase("generating")
      setIsSubmitting(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Generation could not start.")
      setIsSubmitting(false)
      setUploadPhase("ready")
    }
  }

  // Persist deferred metadata to localStorage whenever a field blurs
  function persistMeta() {
    if (!storedProductData) return
    const updated: StoredGeneratedProduct = {
      ...storedProductData,
      name: metaName || storedProductData.name,
      slug: slugify(metaName || storedProductData.name),
      category: metaCategory,
      dimensions: {
        width: cmToMeters(metaWidth),
        height: cmToMeters(metaHeight),
        depth: cmToMeters(metaDepth)
      },
      customerUrl: metaUrl || "#",
      price: metaPrice || undefined,
      updatedAt: new Date().toISOString()
    }
    window.localStorage.setItem(GENERATED_PRODUCT_STORAGE_KEY, JSON.stringify(updated))
    setStoredProductData(updated)
  }

  function resetAll() {
    setUploadPhase("idle")
    setPhotos([])
    setPreparedPhotos([])
    setErrorMessage("")
    setGenerationJob(null)
    setStoredProductData(null)
    setProductNameInput("")
    setMetaName("")
  }

  // Derived values
  const canSubmit =
    !isSubmitting &&
    uploadPhase === "ready" &&
    preparedPhotos.length >= MIN_GENERATION_PHOTOS &&
    preparedPhotos.length <= MAX_GENERATION_PHOTOS

  const preparationPct =
    preparationProgress.total > 0
      ? Math.round((preparationProgress.completed / preparationProgress.total) * 100)
      : 0

  const generationProgress = Math.max(
    0,
    Math.min(100, statusPayload?.progress ?? storedProductData?.progress ?? 0)
  )
  const generationMessage =
    pollError ||
    statusPayload?.message ||
    storedProductData?.message ||
    "Building your 3D model…"

  const effectiveStatus =
    statusPayload?.status ?? storedProductData?.status ?? "queued"

  const modelAsset = storedProductData?.asset ?? null
  const assetChecks = modelAsset ? runModelPackageChecks(modelAsset) : []

  const timelineSteps = [
    {
      title: "Photos uploaded",
      detail: `${storedProductData?.photoCount ?? preparedPhotos.length} photos received`,
      state: "done"
    },
    {
      title: "Creating model",
      detail:
        effectiveStatus === "failed"
          ? generationMessage
          : effectiveStatus === "queued" || effectiveStatus === "running"
          ? generationMessage
          : "3D model built",
      state:
        effectiveStatus === "failed"
          ? "failed"
          : effectiveStatus === "queued" || effectiveStatus === "running"
          ? "active"
          : "done"
    },
    {
      title: "Packaging AR files",
      detail:
        effectiveStatus === "succeeded"
          ? "GLB, USDZ, and poster stored"
          : "GLB + USDZ + poster image",
      state:
        effectiveStatus === "succeeded"
          ? "done"
          : effectiveStatus === "failed"
          ? "pending"
          : "active"
    },
    {
      title: "Ready to review",
      detail:
        effectiveStatus === "succeeded"
          ? "Send to quality review below"
          : "Unlocks after packaging",
      state: effectiveStatus === "succeeded" ? "active" : "pending"
    }
  ]

  return (
    <AppShell>
      {/* ── Page header ───────────────────────────────────────── */}
      <header className="topbar">
        <div>
          <p className="eyebrow">Create AR product</p>
          <h1 style={{ marginBottom: 6 }}>
            {uploadPhase === "idle"
              ? "Drop your product photos"
              : uploadPhase === "generating"
              ? "Building your 3D model…"
              : uploadPhase === "revealed"
              ? metaName || storedProductData?.name || "Your 3D model is ready"
              : uploadPhase === "error"
              ? "Generation failed"
              : "Upload product photos"}
          </h1>
          {uploadPhase === "idle" && (
            <p className="muted">
              {MAX_GENERATION_PHOTOS} photos · JPG or PNG · auto-optimized
              in browser · secure upload
            </p>
          )}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {uploadPhase === "revealed" && (
            <>
              {modelAsset?.glbUrl && (
                <a
                  className="button secondary"
                  href={modelAsset.glbUrl}
                  aria-label="Download GLB file"
                >
                  Download GLB
                </a>
              )}
              <Link className="button accent" href="/approval">
                Send to review
              </Link>
            </>
          )}
          {(uploadPhase === "error" || uploadPhase === "generating") && (
            <Link className="button secondary" href="/dashboard">
              Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* ── EMPTY: dropzone hero ──────────────────────────────── */}
      {uploadPhase === "idle" && (
        <Reveal variant="scale">
          <div
            className="createSurface bg-dotgrid"
            style={{ border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}
          >
            <div
              className="glow-blob glow-blob--emerald"
              style={{ width: 440, height: 320, top: -80, left: "50%", transform: "translateX(-50%)", opacity: 0.65 }}
              aria-hidden="true"
            />
            <div
              className={`dropzone${isDragOver ? " dragOver" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Click to choose photos, or drag and drop them here"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
              }}
            >
              <div className="dropzoneIcon" aria-hidden="true">
                <Upload size={28} />
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>
                  Drop {MAX_GENERATION_PHOTOS} photos of your product
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  JPG or PNG · we optimize automatically · no account needed to start
                </p>
              </div>
              <button
                className="button accent"
                type="button"
                style={{ pointerEvents: "none" }}
                aria-hidden="true"
                tabIndex={-1}
              >
                Choose photos
              </button>
              <div className="angleHints">
                {["Front", "3/4 view", "Back", "Top / detail"].map((angle) => (
                  <span key={angle} className="angleHint">{angle}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── PHOTO GRID: preparing / ready ────────────────────── */}
      {(uploadPhase === "preparing" || uploadPhase === "ready") && (
        <Reveal variant="up">
          <form onSubmit={handleSubmit}>
            <div className="panel stack">
              {/* Header */}
              <div className="row">
                <div>
                  <h2 style={{ marginBottom: 4 }}>Your photos</h2>
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    {preparedPhotos.length} / {photos.length} ready · click any photo to enlarge ·{" "}
                    {MAX_GENERATION_PHOTOS} required
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    className={`badge ${
                      preparedPhotos.length >= MIN_GENERATION_PHOTOS ? "success" : "warning"
                    }`}
                  >
                    {photos.length} photo{photos.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    className="button secondary sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Photo grid */}
              <div className="photoGrid" role="list" aria-label="Selected photos">
                {photos.map((file, i) => (
                  <div
                    key={i}
                    className="photoTile"
                    role="listitem"
                    onClick={() => setLightboxIndex(i)}
                    tabIndex={0}
                    aria-label={`View ${file.name} (${preparedPhotos[i] ? "ready" : "preparing"})`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setLightboxIndex(i)
                    }}
                  >
                    {photoObjectUrls[i] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="photoTileImage"
                        src={photoObjectUrls[i]}
                        alt={file.name}
                        draggable={false}
                      />
                    )}
                    <div className="photoTileOverlay">
                      <span
                        className={`photoTileStatus ${preparedPhotos[i] ? "ready" : "preparing"}`}
                      >
                        {preparedPhotos[i]
                          ? "Ready"
                          : preparationProgress.currentFileName === file.name
                          ? "Optimizing…"
                          : "Queued"}
                      </span>
                    </div>
                    <button
                      className="photoTileRemove"
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        removePhoto(i)
                      }}
                    >
                      <X size={11} aria-hidden />
                    </button>
                  </div>
                ))}

                {photos.length < MAX_GENERATION_PHOTOS && (
                  <div
                    className="photoTileAdd"
                    role="button"
                    tabIndex={0}
                    aria-label="Add more photos"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
                    }}
                  >
                    <span style={{ fontSize: 20 }}>+</span>
                    <span>Add more</span>
                  </div>
                )}
              </div>

              {/* Preparation progress */}
              {uploadPhase === "preparing" && (
                <div className="uploadProgress" aria-live="polite">
                  <div className="uploadProgressHeader">
                    <strong>
                      {preparationProgress.currentFileName
                        ? `Optimizing ${preparationProgress.currentFileName}…`
                        : "Preparing photos…"}
                    </strong>
                    <span>{preparationPct}%</span>
                  </div>
                  <div
                    className="uploadProgressBar"
                    role="progressbar"
                    aria-valuenow={preparationPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${preparationPct}%` }} />
                  </div>
                </div>
              )}

              {/* Quick product name */}
              <div className="field">
                <label htmlFor="quick-product-name">
                  Product name{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                    (optional — you can fill it in after)
                  </span>
                </label>
                <input
                  id="quick-product-name"
                  value={productNameInput}
                  onChange={(e) => setProductNameInput(e.target.value)}
                  placeholder="e.g. Arc Oak Dining Chair"
                  disabled={isSubmitting}
                />
              </div>

              {errorMessage && (
                <div className="assumptionNote" role="alert">
                  {errorMessage}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  className="button accent"
                  type="submit"
                  disabled={!canSubmit}
                >
                  {uploadPhase === "preparing"
                    ? "Preparing photos…"
                    : `Generate my 3D model`}
                </button>
                <div className="toggleField" style={{ flex: "none", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8, display: "flex", gap: 10, alignItems: "center" }}>
                  <label htmlFor="image-enhancement" style={{ fontSize: 12, fontWeight: 700, margin: 0, cursor: "pointer" }}>
                    Image enhancement
                  </label>
                  <input
                    id="image-enhancement"
                    type="checkbox"
                    checked={metaEnhancement}
                    onChange={(e) => setMetaEnhancement(e.target.checked)}
                    disabled={isSubmitting}
                    style={{ accentColor: "var(--accent)", height: 18, width: 18 }}
                  />
                </div>
              </div>
            </div>
          </form>
        </Reveal>
      )}

      {/* ── UPLOAD PROGRESS ──────────────────────────────────── */}
      {(uploadPhase === "uploading" || uploadPhase === "starting") && (
        <Reveal variant="scale">
          <div className="panel stack">
            {photoObjectUrls.length > 0 && (
              <div className="filmstrip" aria-hidden="true">
                {photoObjectUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} className="filmstripThumb" src={url} alt="" />
                ))}
              </div>
            )}
            <div className="uploadProgress" aria-live="polite">
              <div className="uploadProgressHeader">
                <strong>
                  {uploadPhase === "uploading"
                    ? `Uploading ${photos.length} photo${photos.length !== 1 ? "s" : ""}…`
                    : "Starting generation…"}
                </strong>
                {uploadPhase === "uploading" && <span>{uploadProgress}%</span>}
              </div>
              <div
                className={
                  uploadPhase === "starting"
                    ? "uploadProgressBar indeterminate"
                    : "uploadProgressBar"
                }
                role={uploadPhase === "starting" ? "status" : "progressbar"}
                aria-valuenow={uploadPhase === "uploading" ? uploadProgress : undefined}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span
                  style={{
                    width: uploadPhase === "uploading" ? `${uploadProgress}%` : undefined
                  }}
                />
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── GENERATING: inline progress ──────────────────────── */}
      {uploadPhase === "generating" && (
        <Reveal variant="up">
          <div
            className="panel bg-dotgrid"
            style={{ position: "relative", overflow: "hidden", padding: 28 }}
          >
            <div
              className="glow-blob glow-blob--emerald"
              style={{ width: 360, height: 260, top: -60, right: -40, opacity: 0.55 }}
              aria-hidden="true"
            />
            <div
              className="createTwoCol"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 268px",
                gap: 28,
                alignItems: "start",
                position: "relative"
              }}
            >
              {/* Left: progress + skeleton */}
              <div style={{ display: "grid", gap: 20 }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>Building your model</p>
                  <h2 style={{ marginBottom: 6 }}>
                    {storedProductData?.name ?? "Your 3D model"}
                  </h2>
                  <p className="muted" style={{ fontSize: 14 }}>{generationMessage}</p>
                </div>

                {/* Model placeholder skeleton */}
                <div
                  style={{
                    aspectRatio: "16/10",
                    background:
                      "linear-gradient(135deg, rgba(31,111,91,0.08), rgba(138,90,37,0.05)), #f0f4ec",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative"
                  }}
                  aria-hidden="true"
                >
                  <div
                    style={{
                      width: "38%",
                      aspectRatio: "1",
                      background:
                        "radial-gradient(circle, rgba(16,185,129,0.22), rgba(16,185,129,0.04))",
                      borderRadius: "50%",
                      animation: "skeletonPulse 2.2s ease-in-out infinite"
                    }}
                  />
                  <Box
                    size={36}
                    style={{
                      position: "absolute",
                      color: "rgba(31,111,91,0.22)",
                      animation: "skeletonPulse 2.2s ease-in-out infinite"
                    }}
                    strokeWidth={1.2}
                  />
                  <p
                    style={{
                      position: "absolute",
                      bottom: 14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      color: "var(--muted)",
                      fontSize: 13,
                      fontWeight: 700,
                      margin: 0,
                      whiteSpace: "nowrap"
                    }}
                  >
                    ~2 min remaining
                  </p>
                </div>

                {/* Progress bar */}
                <div className="uploadProgress" aria-live="polite">
                  <div className="uploadProgressHeader">
                    <strong>Generation progress</strong>
                    <span>{generationProgress}%</span>
                  </div>
                  <div
                    className={
                      generationProgress <= 0
                        ? "uploadProgressBar indeterminate"
                        : "uploadProgressBar"
                    }
                    role="progressbar"
                    aria-valuenow={generationProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${generationProgress}%` }} />
                  </div>
                </div>

                {isPolling && (
                  <p className="muted" style={{ fontSize: 12, margin: 0 }} aria-live="polite">
                    Checking status…
                  </p>
                )}
              </div>

              {/* Right: semantic timeline */}
              <div className="panel">
                <RevealStagger variant="up" initialDelay={80} step={80}>
                  {timelineSteps.map((step) => (
                    <div className="timelineStep" key={step.title}>
                      <div className={`timelineStepDot ${step.state}`}>
                        {step.state === "done" && (
                          <Check size={12} aria-hidden />
                        )}
                        {step.state === "active" && (
                          <Loader2
                            size={12}
                            aria-hidden
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        )}
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: 13, lineHeight: 1.3 }}>
                          {step.title}
                        </strong>
                        <p
                          className="muted"
                          style={{ fontSize: 12, margin: "3px 0 0", lineHeight: 1.45 }}
                        >
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </RevealStagger>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── REVEALED: model hero + deferred metadata ─────────── */}
      {uploadPhase === "revealed" && modelAsset && (
        <Reveal variant="scale">
          <div style={{ position: "relative" }}>
            <div
              className="glow-blob glow-blob--emerald"
              style={{
                width: 600,
                height: 400,
                top: -100,
                left: "25%",
                opacity: 0.35,
                position: "absolute",
                pointerEvents: "none"
              }}
              aria-hidden="true"
            />

            <div
              className="revealedTwoCol"
              style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, position: "relative" }}
            >
              {/* Model viewer */}
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <p className="eyebrow" style={{ margin: 0 }}>Generated 3D model</p>
                  <span className={`badge ${modelAsset.glbUrl ? "success" : "neutral"}`}>
                    GLB {modelAsset.glbUrl ? "✓" : "—"}
                  </span>
                  <span className={`badge ${modelAsset.usdzUrl ? "success" : "neutral"}`}>
                    USDZ {modelAsset.usdzUrl ? "✓" : "—"}
                  </span>
                  <span className={`badge ${modelAsset.posterUrl ? "success" : "neutral"}`}>
                    Poster {modelAsset.posterUrl ? "✓" : "—"}
                  </span>
                  {modelAsset.triangleCount > 0 && (
                    <span className="badge neutral">
                      {modelAsset.triangleCount.toLocaleString()} tris
                    </span>
                  )}
                </div>

                <ModelViewer
                  asset={modelAsset}
                  alt={`${metaName || storedProductData?.name || "Product"} 3D model`}
                  arShareUrl={null}
                  arPreviewProductId={storedProductData?.productId}
                />

                {assetChecks.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {assetChecks.slice(0, 4).map((check) => (
                      <span
                        key={check.id}
                        className={`badge ${
                          check.status === "pass"
                            ? "success"
                            : check.status === "warning"
                            ? "warning"
                            : "danger"
                        }`}
                      >
                        {check.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Deferred metadata form */}
              <div className="panel stack">
                <div>
                  <h2 style={{ marginBottom: 4 }}>Product details</h2>
                  <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                    Optional — add before sending to review.
                  </p>
                </div>

                <div className="field">
                  <label htmlFor="meta-name">Product name</label>
                  <input
                    id="meta-name"
                    value={metaName}
                    onChange={(e) => setMetaName(e.target.value)}
                    placeholder="e.g. Arc Oak Dining Chair"
                    onBlur={persistMeta}
                  />
                </div>

                <div className="field">
                  <label htmlFor="meta-category">Category</label>
                  <select
                    id="meta-category"
                    value={metaCategory}
                    onChange={(e) => {
                      setMetaCategory(e.target.value as ProductCategory)
                      setTimeout(persistMeta, 0)
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 800,
                      marginBottom: 7
                    }}
                  >
                    Dimensions (cm)
                  </span>
                  <div
                    className="grid three"
                    style={{ gap: 8 }}
                  >
                    {[
                      { id: "meta-w", label: "W", value: metaWidth, set: setMetaWidth, placeholder: "48" },
                      { id: "meta-h", label: "H", value: metaHeight, set: setMetaHeight, placeholder: "82" },
                      { id: "meta-d", label: "D", value: metaDepth, set: setMetaDepth, placeholder: "52" }
                    ].map(({ id, label, value, set, placeholder }) => (
                      <div className="field" key={id}>
                        <label htmlFor={id} style={{ fontSize: 12 }}>{label}</label>
                        <input
                          id={id}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          placeholder={placeholder}
                          inputMode="decimal"
                          onBlur={persistMeta}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="meta-url">Store URL</label>
                  <input
                    id="meta-url"
                    type="url"
                    value={metaUrl}
                    onChange={(e) => setMetaUrl(e.target.value)}
                    placeholder="https://yourstore.com/products/…"
                    onBlur={persistMeta}
                  />
                </div>

                <div className="field">
                  <label htmlFor="meta-price">
                    Price{" "}
                    <span style={{ color: "var(--muted)", fontWeight: 500 }}>(optional)</span>
                  </label>
                  <input
                    id="meta-price"
                    value={metaPrice}
                    onChange={(e) => setMetaPrice(e.target.value)}
                    placeholder="e.g. 89 EUR"
                    onBlur={persistMeta}
                  />
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <Link className="button accent" href="/approval">
                    Send to quality review
                  </Link>
                  <div style={{ display: "flex", gap: 8 }}>
                    {modelAsset.glbUrl && (
                      <a
                        className="button secondary"
                        href={modelAsset.glbUrl}
                        style={{ flex: 1, textAlign: "center" }}
                      >
                        Download GLB
                      </a>
                    )}
                    {modelAsset.usdzUrl && (
                      <a
                        className="button secondary"
                        href={modelAsset.usdzUrl}
                        style={{ flex: 1, textAlign: "center" }}
                      >
                        Download USDZ
                      </a>
                    )}
                  </div>
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => {
                      window.localStorage.removeItem(GENERATED_PRODUCT_STORAGE_KEY)
                      resetAll()
                    }}
                  >
                    Start a new product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── ERROR state ──────────────────────────────────────── */}
      {uploadPhase === "error" && (
        <Reveal variant="up">
          <div className="panel stack">
            <div>
              <h2>Generation failed</h2>
              <p className="muted">
                {errorMessage ||
                  "Something went wrong during model generation. Try uploading clearer photos with neutral backgrounds."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="button accent" type="button" onClick={resetAll}>
                Try again with new photos
              </button>
              <Link className="button secondary" href="/dashboard">
                Back to dashboard
              </Link>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightboxIndex !== null && photoObjectUrls.length > 0 && (
        <PhotoLightbox
          objectUrls={photoObjectUrls}
          names={photos.map((f) => f.name)}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        style={{ display: "none" }}
        onChange={handlePhotoChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </AppShell>
  )
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validatePhotoSelection(files: File[]) {
  if (files.length < MIN_GENERATION_PHOTOS || files.length > MAX_GENERATION_PHOTOS) {
    return `Upload exactly ${MAX_GENERATION_PHOTOS} product photos (JPG or PNG).`
  }
  if (files.some((f) => !isSupportedPhoto(f))) {
    return "Use JPG or PNG photos only."
  }
  return ""
}

function validatePreparedPhotos(files: PreparedGenerationPhoto[]) {
  if (files.length < MIN_GENERATION_PHOTOS || files.length > MAX_GENERATION_PHOTOS) {
    return "Wait for all photos to finish preparing before starting generation."
  }
  const oversized = files.find((p) => p.preparedSize > MAX_GENERATION_PHOTO_SIZE_BYTES)
  if (oversized) {
    return `Could not prepare ${oversized.originalName} under ${formatMegabytes(MAX_GENERATION_PHOTO_SIZE_BYTES)}. Try a clearer source photo.`
  }
  const total = files.reduce((s, p) => s + p.preparedSize, 0)
  if (total > MAX_GENERATION_PHOTO_BYTES_TOTAL) {
    return `Photos are still too large combined. The limit is ${formatMegabytes(MAX_GENERATION_PHOTO_BYTES_TOTAL)}.`
  }
  if (total > TARGET_GENERATION_PHOTO_BYTES_TOTAL) {
    return `Photos exceed the upload target of ${formatMegabytes(TARGET_GENERATION_PHOTO_BYTES_TOTAL)}. Try clearer photos with fewer pixels.`
  }
  return ""
}

function isSupportedPhoto(file: File) {
  if (SUPPORTED_GENERATION_IMAGE_TYPES.has(file.type.toLowerCase())) return true
  const n = file.name.toLowerCase()
  return n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png")
}

// ─── API helpers ─────────────────────────────────────────────────────────────

function getPreparedPhotoContentType(file: File): GenerationPhotoContentType {
  return file.type.toLowerCase() === "image/png" ? "image/png" : "image/jpeg"
}

async function createGenerationUploads(
  productName: string,
  preparedPhotos: PreparedGenerationPhoto[]
): Promise<CreateGenerationUploadsResponse> {
  const response = await fetch("/api/generation/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productName,
      category: "chair",
      photos: preparedPhotos.map((photo) => ({
        fileName: photo.file.name,
        contentType: getPreparedPhotoContentType(photo.file),
        size: photo.preparedSize
      }))
    })
  })
  const payload = await readJsonPayload<CreateGenerationUploadsResponse>(response)
  if (!response.ok || !payload.productId || !payload.uploads) {
    throw new Error(payload.errorMessage ?? "Could not prepare photo uploads. Please try again.")
  }
  return payload as CreateGenerationUploadsResponse
}

async function uploadPreparedPhotos(
  preparedPhotos: PreparedGenerationPhoto[],
  uploads: CreateGenerationUploadsResponse["uploads"],
  onProgress: (pct: number) => void
) {
  if (preparedPhotos.length !== uploads.length) {
    throw new Error("Upload target count mismatch. Please try again.")
  }
  const uploadedBytes = new Array<number>(preparedPhotos.length).fill(0)
  const totalBytes = preparedPhotos.reduce((s, p) => s + p.preparedSize, 0)

  for (const [i, photo] of preparedPhotos.entries()) {
    await uploadPhotoToR2(photo.file, uploads[i], (loaded) => {
      uploadedBytes[i] = loaded
      onProgress(
        Math.min(100, Math.round((uploadedBytes.reduce((s, v) => s + v, 0) / totalBytes) * 100))
      )
    })
    uploadedBytes[i] = photo.preparedSize
    onProgress(
      Math.min(100, Math.round((uploadedBytes.reduce((s, v) => s + v, 0) / totalBytes) * 100))
    )
  }
}

function uploadPhotoToR2(
  file: File,
  upload: CreateGenerationUploadsResponse["uploads"][number],
  onProgress: (loaded: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", upload.uploadUrl)
    Object.entries(upload.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(file.size, e.loaded))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error("A photo upload failed. Please try again."))
    }
    xhr.onerror = () => reject(new Error("Upload connection failed. Please try again."))
    xhr.onabort = () => reject(new Error("Upload was cancelled."))
    xhr.send(file)
  })
}

async function startGenerationRequest(payload: StartGenerationRequest) {
  const res = await fetch("/api/generation/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  return { status: res.status, body: await res.text() }
}

function readStartGenerationPayload(responseText: string, status: number) {
  const fallback =
    status === 413
      ? "Request rejected — too large. Please try again."
      : "Generation could not start."
  if (!responseText) return { errorMessage: fallback } as Partial<StartGenerationResponse> & { errorMessage?: string }
  try {
    return JSON.parse(responseText) as Partial<StartGenerationResponse> & { errorMessage?: string }
  } catch {
    return { errorMessage: fallback } as Partial<StartGenerationResponse> & { errorMessage?: string }
  }
}

async function readJsonPayload<T extends { errorMessage?: string }>(response: Response) {
  const text = await response.text()
  if (!text) return {} as Partial<T>
  try { return JSON.parse(text) as Partial<T> } catch { return {} as Partial<T> }
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

function createStoredProduct(
  name: string,
  productId: string,
  taskId: string,
  photoCount: number
): StoredGeneratedProduct {
  return {
    productId,
    taskId,
    name: name || "My Product",
    slug: slugify(name || "My Product"),
    category: "chair",
    dimensions: { width: 0, height: 0, depth: 0 },
    customerUrl: "#",
    brandName: organization.name,
    photoCount,
    status: "queued",
    progress: 0,
    message: "Generation is queued.",
    updatedAt: new Date().toISOString()
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function cmToMeters(value: string) {
  const cm = Number.parseFloat(value.replace(",", "."))
  return Number.isFinite(cm) ? Number((cm / 100).toFixed(3)) : 0
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "generated-product"
  )
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
  })
}

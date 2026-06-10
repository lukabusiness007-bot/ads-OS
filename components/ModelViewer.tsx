"use client"

import * as React from "react"
import { configureModelViewerDecoders } from "@/lib/model-viewer-config"
import { detectPlatform, type Platform } from "@/lib/device"
import type { ModelAsset } from "@/lib/types"
import { QrCode } from "./QrCode"

type ModelViewerProps = {
  asset?: Pick<ModelAsset, "glbUrl" | "usdzUrl" | "posterUrl" | "dimensionsPresent">
  alt: string
  onInteract?: () => void
  onArClick?: () => void
  /**
   * The product's public AR page that a phone should open to launch AR. The
   * desktop "scan with your phone" QR encodes this with `?ar=1` so the phone
   * auto-prompts AR on arrival. May be a relative path (e.g.
   * `/p/merchant/product`) — it is resolved to an absolute URL so phones can
   * reach it.
   *
   * - `undefined` → fall back to the current page URL (correct on the public
   *   hosted page, which *is* the AR page).
   * - `null` → the product has no public AR page yet (not published); the QR
   *   renders a disabled "available after publishing" state.
   */
  arShareUrl?: string | null
  /**
   * Product id used to mint a short-lived, signed AR preview link on demand
   * when `arShareUrl` is `null` (unpublished products). When set, opening the
   * QR modal fetches `/api/ar-preview/token` for a fresh ~30-minute link
   * instead of showing the permanently-disabled "available after publishing"
   * state.
   */
  arPreviewProductId?: string
}

type LoadError = { message: string; detail?: string }

/** Build the phone-facing AR URL: the share target with `ar=1` forced on. */
function withArParam(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    url.searchParams.set("ar", "1")
    return url.toString()
  } catch {
    return rawUrl
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veridianar.com"

const MODEL_VIEWER_SRC_VERSION = "decoder-v2"

function versionModelViewerUrl(url: string) {
  const hashIndex = url.indexOf("#")
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex)
  const separator = base.includes("?") ? "&" : "?"

  return `${base}${separator}viewer=${MODEL_VIEWER_SRC_VERSION}${hash}`
}

export function ModelViewer({ asset, alt, onInteract, onArClick, arShareUrl, arPreviewProductId }: ModelViewerProps) {
  const [loadError, setLoadError] = React.useState<LoadError | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [hasInteracted, setHasInteracted] = React.useState(false)
  const [loadProgress, setLoadProgress] = React.useState(0)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [platform, setPlatform] = React.useState<Platform | null>(null)
  const [showQr, setShowQr] = React.useState(false)
  const [shareUrl, setShareUrl] = React.useState("")
  const [showArPrompt, setShowArPrompt] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [tokenStatus, setTokenStatus] = React.useState<"idle" | "loading" | "error">("idle")
  const [retryNonce, setRetryNonce] = React.useState(0)
  const viewerRef = React.useRef<HTMLElement | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)

  // The product has no permanent public AR page (not published), but a
  // short-lived signed preview link can be minted on demand.
  const canMintPreview = arShareUrl === null && !!arPreviewProductId

  // Resolve device + the URL the QR should point at. Runs only on the client.
  React.useEffect(() => {
    setPlatform(detectPlatform())
    if (arShareUrl === null) {
      // Product has no public AR page yet — leave shareUrl empty so the QR
      // renders its disabled state.
      setShareUrl("")
    } else {
      const base = arShareUrl ?? window.location.href
      // Resolve relative public URLs (e.g. "/p/merchant/product") to absolute
      // so a phone scanning the QR can actually reach the page.
      let absolute = base
      try {
        absolute = new URL(base, window.location.origin).toString()
      } catch {
        // Leave `base` as-is if it can't be parsed.
      }
      setShareUrl(absolute)
    }
    // If a phone arrived via the desktop QR (?ar=1), offer a one-tap AR launch.
    const wantsAr = new URLSearchParams(window.location.search).get("ar") === "1"
    if (wantsAr && (detectPlatform() === "ios" || detectPlatform() === "android")) {
      setShowArPrompt(true)
    }
  }, [arShareUrl])

  const isDesktop = platform === "web"
  // The product isn't published yet and has no mintable preview link either.
  const arUnavailable = arShareUrl === null && !canMintPreview
  const qrLoading = canMintPreview && tokenStatus === "loading"
  const qrError = canMintPreview && tokenStatus === "error"

  // Mint a fresh, short-lived AR preview link each time the QR modal opens —
  // a stale tab never shows an expired QR.
  React.useEffect(() => {
    if (!showQr || !canMintPreview || !arPreviewProductId) return

    let cancelled = false
    // Deferred so the setState isn't called synchronously in the effect body.
    queueMicrotask(() => {
      if (!cancelled) setTokenStatus("loading")
    })

    fetch(`/api/ar-preview/token?productId=${encodeURIComponent(arPreviewProductId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to mint AR preview token")
        const data = (await res.json()) as { path?: string }
        if (!data.path) throw new Error("Missing AR preview path")
        return data.path
      })
      .then((path) => {
        if (cancelled) return
        setShareUrl(new URL(path, window.location.origin).toString())
        setTokenStatus("idle")
      })
      .catch(() => {
        if (!cancelled) setTokenStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [showQr, canMintPreview, arPreviewProductId, retryNonce])

  function launchAr() {
    setShowArPrompt(false)
    onArClick?.()
    const el = viewerRef.current as (HTMLElement & { activateAR?: () => void }) | null
    try {
      el?.activateAR?.()
    } catch {
      // activateAR can throw if AR isn't ready yet; the user can retry via the
      // model-viewer AR button, which remains available.
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(withArParam(shareUrl))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  React.useEffect(() => {
    configureModelViewerDecoders()
    import("@google/model-viewer").catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      setLoadError({ message: "3D viewer script failed to load.", detail: message })
    })
  }, [])

  React.useEffect(() => {
    const el = viewerRef.current
    if (!el) return

    function onError(e: Event) {
      const detail = (e as CustomEvent<{ type: string; sourceError?: Error }>).detail
      const sourceMessage = detail?.sourceError?.message
      const isMaskedSceneError = !!sourceMessage && /reading 'scene'|\.scene/.test(sourceMessage)
      setLoadError({
        message: "Could not load 3D model.",
        detail: isMaskedSceneError
          ? "The GLB could not be fetched or parsed. Check the browser console for the underlying error and verify the model URL."
          : sourceMessage ?? detail?.type ?? "unknown error"
      })
    }

    el.addEventListener("error", onError)
    return () => el.removeEventListener("error", onError)
  }, [asset?.glbUrl])

  // Track model-viewer download/parse progress for the loading indicator.
  React.useEffect(() => {
    const el = viewerRef.current
    if (!el) return

    setLoadProgress(0)
    setIsLoaded(false)

    function onProgress(e: Event) {
      const total = (e as CustomEvent<{ totalProgress: number }>).detail?.totalProgress ?? 0
      setLoadProgress(total)
      if (total >= 1) setIsLoaded(true)
    }
    function onLoad() {
      setLoadProgress(1)
      setIsLoaded(true)
    }

    el.addEventListener("progress", onProgress)
    el.addEventListener("load", onLoad)
    return () => {
      el.removeEventListener("progress", onProgress)
      el.removeEventListener("load", onLoad)
    }
  }, [asset?.glbUrl])

  // Sync fullscreen state with native fullscreen API events
  React.useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  // Close CSS-overlay fullscreen on Escape
  React.useEffect(() => {
    if (!isFullscreen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isFullscreen])

  // Close the QR modal on Escape
  React.useEffect(() => {
    if (!showQr) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowQr(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [showQr])


  function toggleFullscreen() {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    // Native Fullscreen API — desktop + Android Chrome
    if (wrapper.requestFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        wrapper.requestFullscreen().catch(() => {
          // Blocked (e.g. iOS) — fall back to CSS overlay
          setIsFullscreen(f => !f)
        })
      }
    } else {
      // iOS Safari — toggle CSS full-viewport overlay
      setIsFullscreen(f => !f)
    }
  }

  if (!asset?.glbUrl) {
    return (
      <div className="viewer modelViewerFallback" aria-label="3D model unavailable">
        <strong>No model yet</strong>
        <span>Upload or generate a GLB/USDZ package to preview it here.</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="viewer modelViewerFallback" aria-label="3D model load error">
        <strong>Could not display model</strong>
        <span>{loadError.message}</span>
        {loadError.detail && (
          <span className="muted" style={{ fontSize: 12 }}>{loadError.detail}</span>
        )}
      </div>
    )
  }

  const modelViewerProps = {
    ref: viewerRef,
    src: versionModelViewerUrl(asset.glbUrl),
    "ios-src": asset.usdzUrl,
    poster: asset.posterUrl || undefined,
    alt,
    ar: true,
    "ar-modes": "webxr scene-viewer quick-look",
    // Models packaged with real product dimensions are baked to true scale —
    // lock AR sizing so they appear life-size. Without dimensions, the model's
    // size is arbitrary, so let the viewer allow pinch-to-resize instead.
    "ar-scale": asset.dimensionsPresent === false ? "auto" : "fixed",
    "camera-controls": true,
    "touch-action": "pan-y",
    "auto-rotate": true,
    "auto-rotate-delay": "0",
    "rotation-per-second": "24deg",
    "interaction-prompt": "none",
    reveal: "auto",
    loading: "lazy",
    "tone-mapping": "commerce",
    "shadow-intensity": "1",
    "shadow-softness": "1",
    // No environment-image: model-viewer's built-in neutral lighting renders the
    // albedo texture in true color. A studio HDR here mirror-washed light models
    // to white. 0.9 keeps texture detail.
    exposure: "0.9",
  } satisfies React.HTMLAttributes<HTMLElement> & Record<string, unknown>

  function handlePointerDown() {
    setHasInteracted(true)
    onInteract?.()
  }

  return (
    <div
      ref={wrapperRef}
      className={`viewer modelViewerFrame${isFullscreen ? " modelViewerFullscreen" : ""}`}
      onPointerDown={handlePointerDown}
    >
      {React.createElement("model-viewer", modelViewerProps,
        <button className="modelArButton" slot="ar-button" type="button" onClick={onArClick} aria-label="View product in augmented reality">
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M9 9l3-3 3 3M12 6v8" />
          </svg>
          View in AR
        </button>
      )}

      {/* Desktop has no native AR — offer a phone hand-off via QR instead. */}
      {isDesktop && (
        <button
          className="modelArButton"
          type="button"
          onClick={() => setShowQr(true)}
          aria-haspopup="dialog"
          aria-label="View in AR on your phone — show QR code"
        >
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3M21 14v.01M21 21v-4M17 21h4" />
          </svg>
          View in AR
        </button>
      )}

      {isDesktop && showQr && (
        <div
          className="qrArOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qrArTitle"
          onClick={() => setShowQr(false)}
        >
          <div className="qrArCard" onClick={(e) => e.stopPropagation()}>
            <button
              className="qrArClose"
              type="button"
              onClick={() => setShowQr(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3 id="qrArTitle" className="qrArTitle">View in your space</h3>
            {arUnavailable ? (
              <>
                <p className="qrArLead">
                  This product’s AR page isn’t live yet. The QR code becomes available once the model is approved and published.
                </p>
                <div className="qrArCodeFrame qrArCodeDisabled" aria-hidden="true">
                  <QrCode value={SITE_URL} size={208} ecl="M" />
                </div>
                <p className="qrArDisabledNote">Available after publishing</p>
              </>
            ) : (
              <>
                <p className="qrArLead">
                  {qrError
                    ? "We couldn’t prepare an AR link for this product."
                    : "Scan this QR code with your phone camera to launch augmented reality."}
                </p>
                <div
                  className={`qrArCodeFrame${qrLoading || qrError ? " qrArCodeDisabled" : ""}`}
                  aria-hidden={qrLoading || qrError ? "true" : undefined}
                >
                  <QrCode value={qrLoading || qrError ? SITE_URL : withArParam(shareUrl)} size={208} ecl="M" />
                </div>
                {qrLoading && <p className="qrArDisabledNote">Preparing your AR link…</p>}
                {qrError ? (
                  <button className="qrArCopy" type="button" onClick={() => setRetryNonce((n) => n + 1)}>
                    Try again
                  </button>
                ) : !qrLoading && (
                  <>
                    <ol className="qrArSteps">
                      <li>Open the Camera app on your phone</li>
                      <li>Point it at the code above</li>
                      <li>Tap the link, then tap “View in AR”</li>
                    </ol>
                    <button className="qrArCopy" type="button" onClick={copyShareLink}>
                      {copied ? "Link copied" : "Copy link instead"}
                    </button>
                    {canMintPreview && <p className="qrArDisabledNote">Link expires in ~30 minutes</p>}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showArPrompt && (
        <button
          className="arLaunchPrompt"
          type="button"
          onClick={launchAr}
          aria-label="Tap to view this product in augmented reality"
        >
          <svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M9 9l3-3 3 3M12 6v8" />
          </svg>
          Tap to view in AR
        </button>
      )}

      {!isLoaded && (
        <div className="modelLoadingOverlay" role="status" aria-live="polite">
          <div className="modelLoadingStage" aria-hidden="true">
            <span className="modelLoadingGlow" />
            <svg
              className="modelLoadingCube"
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <path d="M3.27 6.96 12 12.01l8.73-5.05" />
              <path d="M12 22.08V12" />
            </svg>
          </div>
          <div className="modelLoadingBar">
            <div className="modelLoadingFill" style={{ width: `${Math.round(loadProgress * 100)}%` }} />
          </div>
          <span className="modelLoadingLabel">
            Loading 3D model
            <span className="modelLoadingPercent">{Math.round(loadProgress * 100)}%</span>
          </span>
        </div>
      )}

      {!hasInteracted && (
        <div className="rotateHint" aria-hidden="true">
          {/* Circular-arrows rotate icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Drag to rotate
        </div>
      )}

      <button
        className="modelFullscreenButton"
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? "✕" : "⛶"}
      </button>

    </div>
  )
}

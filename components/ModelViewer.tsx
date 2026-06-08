"use client"

import * as React from "react"
import { configureModelViewerDecoders } from "@/lib/model-viewer-config"
import type { ModelAsset } from "@/lib/types"

type ModelViewerProps = {
  asset?: Pick<ModelAsset, "glbUrl" | "usdzUrl" | "posterUrl">
  alt: string
  onInteract?: () => void
  onArClick?: () => void
}

type LoadError = { message: string; detail?: string }

const MODEL_VIEWER_SRC_VERSION = "decoder-v2"

function versionModelViewerUrl(url: string) {
  const hashIndex = url.indexOf("#")
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex)
  const separator = base.includes("?") ? "&" : "?"

  return `${base}${separator}viewer=${MODEL_VIEWER_SRC_VERSION}${hash}`
}

export function ModelViewer({ asset, alt, onInteract, onArClick }: ModelViewerProps) {
  const [loadError, setLoadError] = React.useState<LoadError | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [hasInteracted, setHasInteracted] = React.useState(false)
  const [loadProgress, setLoadProgress] = React.useState(0)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const viewerRef = React.useRef<HTMLElement | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)

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
    "ar-scale": "fixed",
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

      {!isLoaded && (
        <div className="modelLoadingOverlay" role="status" aria-live="polite">
          <div className="modelLoadingBar">
            <div className="modelLoadingFill" style={{ width: `${Math.round(loadProgress * 100)}%` }} />
          </div>
          <span>Loading model… {Math.round(loadProgress * 100)}%</span>
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

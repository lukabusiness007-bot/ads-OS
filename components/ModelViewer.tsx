"use client"

import * as React from "react"
import type { ModelAsset } from "@/lib/types"

type ModelViewerProps = {
  asset?: Pick<ModelAsset, "glbUrl" | "usdzUrl" | "posterUrl">
  alt: string
  onInteract?: () => void
  onArClick?: () => void
}

type LoadError = { message: string; detail?: string }

export function ModelViewer({ asset, alt, onInteract, onArClick }: ModelViewerProps) {
  const [loadError, setLoadError] = React.useState<LoadError | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [hasInteracted, setHasInteracted] = React.useState(false)
  const viewerRef = React.useRef<HTMLElement | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
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

  // Pre-validate the GLB URL before model-viewer swallows the real failure.
  React.useEffect(() => {
    const glbUrl = asset?.glbUrl
    if (!glbUrl) return

    let cancelled = false
    const controller = new AbortController()
    setLoadError(null)

    ;(async () => {
      try {
        const res = await fetch(glbUrl, { signal: controller.signal })
        if (cancelled) return
        if (!res.ok) {
          setLoadError({
            message: "Could not load 3D model.",
            detail: `The model URL returned HTTP ${res.status} ${res.statusText}. URL: ${glbUrl}`
          })
          return
        }
        const head = new Uint8Array(await res.clone().arrayBuffer().catch(() => new ArrayBuffer(0))).slice(0, 4)
        const magic = String.fromCharCode(...head)
        if (head.length >= 4 && magic !== "glTF") {
          const contentType = res.headers.get("content-type") ?? "unknown"
          setLoadError({
            message: "Could not load 3D model.",
            detail: `The URL did not return a GLB file (content-type: ${contentType}). It may be a 404 page or a broken/expired link. URL: ${glbUrl}`
          })
        }
      } catch (err: unknown) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return
        const message = err instanceof Error ? err.message : String(err)
        setLoadError({
          message: "Could not load 3D model.",
          detail: `Failed to fetch the model URL (${message}). URL: ${glbUrl}`
        })
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
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
    src: asset.glbUrl,
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
    // Light-gray fabrics washed out to white at 1.1; 0.9 keeps texture detail.
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

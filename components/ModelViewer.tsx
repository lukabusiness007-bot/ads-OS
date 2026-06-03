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
  const viewerRef = React.useRef<HTMLElement | null>(null)

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
      setLoadError({
        message: "Could not load 3D model.",
        detail: detail?.sourceError?.message ?? detail?.type ?? "unknown error"
      })
    }

    el.addEventListener("error", onError)
    return () => el.removeEventListener("error", onError)
  }, [asset?.glbUrl])

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
    reveal: "auto",
    loading: "eager",
    "environment-image": "neutral",
    "shadow-intensity": "0.35",
    "shadow-softness": "0.85",
    exposure: "1",
  } satisfies React.HTMLAttributes<HTMLElement> & Record<string, unknown>

  return (
    <div className="viewer modelViewerFrame" onPointerDown={onInteract}>
      {React.createElement("model-viewer", modelViewerProps,
        <button className="modelArButton" slot="ar-button" type="button" onClick={onArClick}>
          View in AR
        </button>
      )}
    </div>
  )
}

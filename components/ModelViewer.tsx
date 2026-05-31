"use client"

import * as React from "react"
import type { ModelAsset } from "@/lib/types"

type ModelViewerProps = {
  asset?: Pick<ModelAsset, "glbUrl" | "usdzUrl" | "posterUrl">
  alt: string
  onInteract?: () => void
  onArClick?: () => void
}

export function ModelViewer({ asset, alt, onInteract, onArClick }: ModelViewerProps) {
  React.useEffect(() => {
    void import("@google/model-viewer")
  }, [])

  if (!asset?.glbUrl) {
    return (
      <div className="viewer modelViewerFallback" aria-label="3D model unavailable">
        <strong>No model yet</strong>
        <span>Upload or generate a GLB/USDZ package to preview it here.</span>
      </div>
    )
  }

  const modelViewerProps = {
    src: asset.glbUrl,
    "ios-src": asset.usdzUrl,
    poster: asset.posterUrl,
    alt,
    ar: true,
    "ar-modes": "webxr scene-viewer quick-look",
    "ar-scale": "fixed",
    "camera-controls": true,
    "touch-action": "pan-y",
    "auto-rotate": true,
    reveal: "auto",
    loading: "eager",
    "shadow-intensity": "1",
    exposure: "0.9",
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

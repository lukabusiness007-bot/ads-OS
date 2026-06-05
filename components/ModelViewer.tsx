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
      const sourceMessage = detail?.sourceError?.message
      // model-viewer masks the real load/parse failure with a secondary
      // "Cannot read properties of undefined (reading 'scene')" thrown off the
      // empty GLTFInstance it substitutes on error. Don't surface that — it's
      // never actionable. The genuine cause is logged to the console by the
      // library, and our pre-fetch check below catches the common cases.
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
  // This turns opaque internal errors into actionable messages (HTTP status,
  // wrong content type, or a body that isn't actually a GLB).
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
        // A valid binary glTF begins with the ASCII magic "glTF".
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
    reveal: "interaction",
    loading: "lazy",
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

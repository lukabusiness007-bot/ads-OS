"use client"

import * as React from "react"
import { configureModelViewerDecoders } from "@/lib/model-viewer-config"

export function HeroGem() {
  React.useEffect(() => {
    configureModelViewerDecoders()
    import("@google/model-viewer").catch(() => {})
  }, [])

  const props = {
    src: "/models/veridian-icosahedron.glb",
    poster: "/img/veridian-poster.png",
    alt: "Augmenta emerald crystal — spinning 3D brand mark",
    "auto-rotate": true,
    "auto-rotate-delay": "0",
    "rotation-per-second": "24deg",
    "camera-controls": true,
    "disable-zoom": true,
    "interaction-prompt": "none",
    "shadow-intensity": "1",
    "shadow-softness": "1",
    exposure: "1.1",
    "tone-mapping": "commerce",
    "camera-orbit": "0deg 72deg 105%",
    "field-of-view": "28deg",
    style: { width: "100%", height: "100%", background: "transparent" },
  } satisfies React.HTMLAttributes<HTMLElement> & Record<string, unknown>

  return React.createElement("model-viewer", props)
}

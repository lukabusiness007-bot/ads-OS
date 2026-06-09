"use client"

import * as React from "react"
import dynamic from "next/dynamic"

/**
 * Global Cmd/Ctrl-K (or "/") palette. This shell always mounts so the
 * keydown listener stays active. The dialog body is code-split via dynamic()
 * and only downloaded on first open.
 */

const CommandPaletteDialog = dynamic(
  () => import("./CommandPaletteDialog").then((m) => ({ default: m.CommandPaletteDialog })),
  { ssr: false }
)

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const inField = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((v) => !v)
        return
      }
      if (!inField && !open && event.key === "/") {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  if (!open) return null
  return <CommandPaletteDialog onClose={() => setOpen(false)} />
}

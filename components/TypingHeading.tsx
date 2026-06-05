"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function TypingHeading({ text }: { text: string }) {
  const [n, setN] = React.useState(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return text.length
    }
    return 0
  })

  React.useEffect(() => {
    if (n >= text.length) return
    const id = setInterval(() => {
      setN((c) => {
        if (c >= text.length) {
          clearInterval(id)
          return c
        }
        return c + 1
      })
    }, 50)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const done = n >= text.length

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, n)}</span>
      <span aria-hidden="true" className={cn("type-caret", done && "type-caret-blink")}>
        |
      </span>
    </>
  )
}

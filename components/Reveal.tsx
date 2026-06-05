"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type RevealProps<T extends React.ElementType> = {
  as?: T
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">

export function Reveal<T extends React.ElementType = "section">({
  as,
  className,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "section") as React.ElementType
  const ref = React.useRef<HTMLElement | null>(null)
  const [shown, setShown] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={cn("reveal", shown && "reveal-visible", className)} {...rest}>
      {children}
    </Tag>
  )
}

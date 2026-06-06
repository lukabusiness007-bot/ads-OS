"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "up" | "left" | "right" | "scale"

type RevealProps<T extends React.ElementType> = {
  as?: T
  className?: string
  children?: React.ReactNode
  variant?: Variant
  delay?: number
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">

export function Reveal<T extends React.ElementType = "section">({
  as,
  className,
  children,
  variant = "up",
  delay,
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
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const variantClass =
    variant === "left"
      ? "reveal-left"
      : variant === "right"
        ? "reveal-right"
        : variant === "scale"
          ? "reveal-scale"
          : "reveal"

  return (
    <Tag
      ref={ref}
      className={cn(variantClass, shown && "reveal-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// ─── RevealStagger ────────────────────────────────────────────────────────────
// Wraps a list of children; each child gets an increasing delay so they
// cascade in one by one once the container enters the viewport.

type RevealStaggerProps = {
  as?: React.ElementType
  className?: string
  children: React.ReactNode
  step?: number        // ms between each child (default 90)
  initialDelay?: number // ms before the first child (default 0)
  variant?: Variant
}

export function RevealStagger({
  as: Tag = "div",
  className,
  children,
  step = 90,
  initialDelay = 0,
  variant = "up",
}: RevealStaggerProps) {
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
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const variantClass =
    variant === "left"
      ? "reveal-left"
      : variant === "right"
        ? "reveal-right"
        : variant === "scale"
          ? "reveal-scale"
          : "reveal"

  const items = React.Children.toArray(children)

  return (
    <Tag ref={ref} className={className}>
      {items.map((child, i) => (
        <div
          key={i}
          className={cn(variantClass, shown && "reveal-visible")}
          style={{ transitionDelay: `${initialDelay + i * step}ms` }}
        >
          {child}
        </div>
      ))}
    </Tag>
  )
}

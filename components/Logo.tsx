import * as React from "react"

/**
 * Augmenta3D brand logo — "AR Viewport" mark (isometric cube framed by AR
 * corner brackets) plus optional wordmark. Rendered inline as SVG so it stays
 * crisp at any size and adapts to light / dark surfaces.
 *
 * Source of truth: /public/brand/*.svg (see README in the brand package).
 */

const INK = "#16140F" // warm near-black
const BONE = "#EDE6D6" // light / neutral
const ACCENT = "#3E6B57" // accent green
const ACCENT_LIGHT = "#9FB7A6" // cube right face

export type LogoTheme = "light" | "dark"

type LogoMarkProps = {
  /** "light" = on a light surface (dark ink), "dark" = on a dark surface (bone). */
  theme?: LogoTheme
  /** Drop the AR corner brackets — they vanish below ~24px (e.g. favicons). */
  brackets?: boolean
  className?: string
  title?: string
}

/** Just the cube mark (with optional AR brackets). Size it via className height. */
export function LogoMark({
  theme = "light",
  brackets = true,
  className,
  title = "Augmenta3D",
}: LogoMarkProps) {
  const ink = theme === "dark" ? BONE : INK
  return (
    <svg
      viewBox="-20 -12 136 150"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* cube */}
      <polygon points="48,7 96,35 48,63 0,35" fill={ink} />
      <polygon points="0,35 48,63 48,119 0,91" fill={ACCENT} />
      <polygon points="96,35 48,63 48,119 96,91" fill={ACCENT_LIGHT} />
      {/* AR corner brackets */}
      {brackets && (
        <g
          stroke={ink}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M-18,2 v-12 h12" />
          <path d="M114,2 v-12 h-12" />
          <path d="M-18,124 v12 h12" />
          <path d="M114,124 v12 h-12" />
        </g>
      )}
    </svg>
  )
}

type LogoProps = LogoMarkProps & {
  /** "mark" = cube only, "lockup" = cube + augmenta3D wordmark. */
  variant?: "mark" | "lockup"
  /** Extra classes for the cube mark inside a lockup. */
  markClassName?: string
}

/**
 * Full brand logo. Default is the horizontal lockup (cube + "augmenta3D").
 * The wordmark inherits the surrounding font; "3D" is always the accent green.
 */
export function Logo({
  variant = "lockup",
  theme = "light",
  brackets = true,
  className,
  markClassName = "h-9 w-auto",
  title = "Augmenta3D",
}: LogoProps) {
  if (variant === "mark") {
    return <LogoMark theme={theme} brackets={brackets} className={className} title={title} />
  }

  const wordInk = theme === "dark" ? BONE : INK
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark theme={theme} brackets={brackets} className={markClassName} title="" />
      <span
        className="text-[1.35rem] font-semibold leading-none tracking-tight"
        style={{ color: wordInk }}
      >
        augmenta<span style={{ color: ACCENT }}>3D</span>
      </span>
    </span>
  )
}

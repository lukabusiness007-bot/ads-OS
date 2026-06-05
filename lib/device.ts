export type Platform = "ios" | "android" | "web"

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "web"

  const ua = navigator.userAgent

  // iPadOS 13+ reports as MacIntel with touch support
  const isIpadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1

  if (/iPhone|iPad|iPod/i.test(ua) || isIpadOS) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "web"
}

export function isArCapable(): boolean {
  const p = detectPlatform()
  return p === "ios" || p === "android"
}

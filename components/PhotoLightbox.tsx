"use client"

import * as React from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

type PhotoLightboxProps = {
  objectUrls: string[]
  names: string[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function PhotoLightbox({
  objectUrls,
  names,
  currentIndex,
  onClose,
  onNavigate
}: PhotoLightboxProps) {
  const total = objectUrls.length
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const touchStartX = React.useRef<number | null>(null)

  React.useEffect(() => {
    closeRef.current?.focus()
  }, [])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return }
      if (e.key === "ArrowLeft") onNavigate((currentIndex - 1 + total) % total)
      if (e.key === "ArrowRight") onNavigate((currentIndex + 1) % total)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [currentIndex, total, onClose, onNavigate])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 48) {
      onNavigate(diff > 0 ? (currentIndex + 1) % total : (currentIndex - 1 + total) % total)
    }
    touchStartX.current = null
  }

  return (
    <div
      className="photoLightboxBackdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${currentIndex + 1} of ${total}: ${names[currentIndex]}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="photoLightboxPanel">
        <div className="photoLightboxHeader">
          <span className="photoLightboxCaption">
            {names[currentIndex]} &middot; {currentIndex + 1} / {total}
          </span>
          <button
            ref={closeRef}
            className="photoLightboxClose"
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="photoLightboxImageWrap">
          {total > 1 && (
            <button
              className="photoLightboxNav photoLightboxNavLeft"
              type="button"
              onClick={() => onNavigate((currentIndex - 1 + total) % total)}
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="photoLightboxImage"
            src={objectUrls[currentIndex]}
            alt={names[currentIndex]}
            key={objectUrls[currentIndex]}
          />

          {total > 1 && (
            <button
              className="photoLightboxNav photoLightboxNavRight"
              type="button"
              onClick={() => onNavigate((currentIndex + 1) % total)}
              aria-label="Next photo"
            >
              <ChevronRight size={22} aria-hidden />
            </button>
          )}
        </div>

        {total > 1 && (
          <div className="photoLightboxDots" aria-hidden="true">
            {objectUrls.map((_, i) => (
              <button
                key={i}
                className={`photoLightboxDot${i === currentIndex ? " active" : ""}`}
                type="button"
                onClick={() => onNavigate(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

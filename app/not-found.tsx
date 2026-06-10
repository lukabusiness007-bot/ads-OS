"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function NotFound() {
  useEffect(() => {
    console.error("[404] Stranica nije pronađena:", window.location.pathname)
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fbfaf6] px-6 text-center">
      <span className="mb-6 text-6xl font-extrabold text-[#dce2d5]">404</span>
      <h1 className="mb-3 text-2xl font-medium text-[#17201a]">Stranica nije pronađena</h1>
      <p className="mb-8 max-w-sm text-[#697266] leading-relaxed">
        Adresa koju tražiš ne postoji ili je premeštena. Proveri URL ili se vrati na početnu.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-[#1f6f5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3b2e] transition-colors"
      >
        ← Nazad na početnu
      </Link>
    </main>
  )
}

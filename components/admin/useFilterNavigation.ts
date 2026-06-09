"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function useFilterNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string | null>, mode: "push" | "replace" = "push") {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete("page")
    const queryString = next.toString()
    router[mode](queryString ? `${pathname}?${queryString}` : pathname)
  }

  return { navigate, searchParams, pathname, router }
}

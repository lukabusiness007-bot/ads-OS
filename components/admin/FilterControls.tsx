"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type FilterTab = { value: string; label: string }

const SEARCH_DEBOUNCE_MS = 300

/**
 * URL-state filter leaf: tabs push instantly, search debounces and replaces
 * (no history spam). Pages stay async server components reading searchParams —
 * this is the only client boundary in the filter row.
 */
export function FilterControls({
  tabs,
  tabParam = "status",
  search,
  searchParam = "q",
  searchPlaceholder = "Search…"
}: {
  tabs?: FilterTab[]
  tabParam?: string
  search?: boolean
  searchParam?: string
  searchPlaceholder?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get(tabParam) ?? tabs?.[0]?.value
  const urlQuery = searchParams.get(searchParam) ?? ""
  const [query, setQuery] = useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Adjust local state during render when the URL changes externally
  // (back/forward, shared links) — see react.dev "You Might Not Need an Effect".
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    setQuery(urlQuery)
  }

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  function navigate(updates: Record<string, string | null>, mode: "push" | "replace") {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete("page")
    const queryString = next.toString()
    router[mode](queryString ? `${pathname}?${queryString}` : pathname)
  }

  function handleSearchInput(value: string) {
    setQuery(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ [searchParam]: value.trim() }, "replace")
    }, SEARCH_DEBOUNCE_MS)
  }

  return (
    <div className="row" style={{ gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      {tabs && tabs.length > 0 && (
        <div className="row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-start" }}>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`button ${activeTab === tab.value ? "accent" : "secondary"} sm`}
              aria-pressed={activeTab === tab.value}
              onClick={() => navigate({ [tabParam]: tab.value }, "push")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {search && (
        <div className="field" style={{ minWidth: 220, maxWidth: 320, marginLeft: "auto" }}>
          <input
            type="search"
            value={query}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            onChange={(event) => handleSearchInput(event.target.value)}
          />
        </div>
      )}
    </div>
  )
}

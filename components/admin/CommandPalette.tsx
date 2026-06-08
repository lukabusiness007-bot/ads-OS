"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2, CheckSquare, LayoutGrid, Package, ScrollText, Users } from "lucide-react"

type SearchResults = {
  products: Array<{ id: string; name: string; status: string; orgName: string | null }>
  users: Array<{ id: string; name: string; email: string | null }>
  orgs: Array<{ id: string; name: string }>
}

type CommandIcon = React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>

type CommandItem = {
  id: string
  group: string
  label: string
  sublabel?: string
  href: string
  icon: CommandIcon
}

const QUICK_ACTIONS: Array<{ id: string; label: string; href: string; icon: CommandIcon }> = [
  { id: "qa-overview", label: "Go to Overview", href: "/admin", icon: LayoutGrid },
  { id: "qa-review", label: "Go to Review Queue", href: "/admin/review", icon: CheckSquare },
  { id: "qa-users", label: "Go to Users", href: "/admin/users", icon: Users },
  { id: "qa-orgs", label: "Go to Orgs", href: "/admin/orgs", icon: Building2 },
  { id: "qa-audit", label: "Go to Audit Log", href: "/admin/audit", icon: ScrollText }
]

const SEARCH_DEBOUNCE_MS = 200
const EMPTY_RESULTS: SearchResults = { products: [], users: [], orgs: [] }

/**
 * Global Cmd/Ctrl-K (or "/") palette: searches products/users/orgs via
 * /api/admin/search and lists static quick actions. Combobox pattern keeps
 * focus on the input — arrow keys move aria-activedescendant, no focus trap
 * needed.
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResults>(EMPTY_RESULTS)
  const [loading, setLoading] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [lastQuery, setLastQuery] = React.useState(query)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const abortRef = React.useRef<AbortController | undefined>(undefined)

  const close = React.useCallback(() => {
    setOpen(false)
    setQuery("")
    setResults(EMPTY_RESULTS)
    setActiveIndex(0)
    setLastQuery("")
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()
  }, [])

  // Reset the cursor whenever the query changes — adjusted during render
  // (react.dev "You Might Not Need an Effect"), same pattern as FilterControls.
  if (query !== lastQuery) {
    setLastQuery(query)
    setActiveIndex(0)
  }

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const inField = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        if (open) close()
        else setOpen(true)
        return
      }
      if (!inField && !open && event.key === "/") {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, close])

  React.useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  React.useEffect(() => () => {
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()
  }, [])

  React.useEffect(() => {
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    const trimmed = query.trim()
    if (!trimmed) return

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : EMPTY_RESULTS))
        .then((data: SearchResults) => setResults(data))
        .catch((error: unknown) => {
          if ((error as { name?: string } | null)?.name !== "AbortError") setResults(EMPTY_RESULTS)
        })
        .finally(() => setLoading(false))
    }, SEARCH_DEBOUNCE_MS)
  }, [query])

  const trimmedQuery = query.trim()
  // Stale results/loading from a just-cleared query shouldn't flash —
  // derive the displayed state from the current query instead of resetting in an effect.
  const visibleResults = trimmedQuery ? results : EMPTY_RESULTS
  const visibleLoading = trimmedQuery ? loading : false

  const groups = React.useMemo<Array<[string, CommandItem[]]>>(() => {
    const trimmed = trimmedQuery.toLowerCase()
    const quickActions: CommandItem[] = QUICK_ACTIONS
      .filter((action) => !trimmed || action.label.toLowerCase().includes(trimmed))
      .map((action) => ({ id: action.id, group: "Quick actions", label: action.label, href: action.href, icon: action.icon }))

    const products: CommandItem[] = visibleResults.products.map((product) => ({
      id: `product-${product.id}`,
      group: "Products",
      label: product.name,
      sublabel: [product.orgName, product.status].filter(Boolean).join(" · "),
      href: `/admin/review/${product.id}`,
      icon: Package
    }))

    const users: CommandItem[] = visibleResults.users.map((user) => ({
      id: `user-${user.id}`,
      group: "Users",
      label: user.name,
      sublabel: user.email ?? undefined,
      href: `/admin/users/${user.id}`,
      icon: Users
    }))

    const orgs: CommandItem[] = visibleResults.orgs.map((org) => ({
      id: `org-${org.id}`,
      group: "Organizations",
      label: org.name,
      href: `/admin/orgs/${org.id}`,
      icon: Building2
    }))

    const grouped: Array<[string, CommandItem[]]> = [
      ["Quick actions", quickActions],
      ["Products", products],
      ["Users", users],
      ["Organizations", orgs]
    ]

    return grouped.filter(([, groupItems]) => groupItems.length > 0)
  }, [trimmedQuery, visibleResults])

  const items = React.useMemo(() => groups.flatMap(([, groupItems]) => groupItems), [groups])

  function select(item: CommandItem | undefined) {
    if (!item) return
    close()
    router.push(item.href)
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, items.length - 1))
        break
      case "ArrowUp":
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case "Enter":
        event.preventDefault()
        select(items[activeIndex])
        break
      case "Escape":
        event.preventDefault()
        close()
        break
      default:
        break
    }
  }

  if (!open) return null

  let renderedIndex = 0

  return (
    <div className="commandPaletteOverlay" role="presentation" onClick={close}>
      <div
        className="commandPalette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="field" style={{ margin: 0 }}>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-haspopup="listbox"
            aria-controls="command-palette-list"
            aria-activedescendant={items[activeIndex]?.id}
            autoComplete="off"
            placeholder="Search products, users, organizations…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
        </div>
        <ul id="command-palette-list" role="listbox" aria-label="Results">
          {items.length === 0 && (
            <li className="commandEmptyState" role="presentation">
              {visibleLoading ? "Searching…" : trimmedQuery ? "No matches — try a different search." : "Type to search, or pick a quick action."}
            </li>
          )}
          {groups.map(([group, groupItems]) => (
            <React.Fragment key={group}>
              <li className="commandGroupLabel" role="presentation">{group}</li>
              {groupItems.map((item) => {
                const index = renderedIndex
                renderedIndex += 1
                const Icon = item.icon
                return (
                  <li
                    key={item.id}
                    id={item.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`commandItem${index === activeIndex ? " commandItemActive" : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => select(item)}
                  >
                    <Icon size={15} strokeWidth={2} aria-hidden />
                    <span>
                      <strong>{item.label}</strong>
                      {item.sublabel && <small>{item.sublabel}</small>}
                    </span>
                  </li>
                )
              })}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </div>
  )
}

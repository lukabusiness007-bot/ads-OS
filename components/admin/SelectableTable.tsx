"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BulkActionBar } from "@/components/admin/BulkActionBar"
import { useToast } from "@/components/admin/ToastProvider"

export type SelectableRow = { id: string; href: string }

export type SelectableColumn<T> = {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  align?: "start" | "end"
}

export type BulkActionResult = { ok: boolean; message: string }

/**
 * The review queue's single client boundary: owns selection, keyboard cursor,
 * and optimistic removal so the page itself stays a server component. Rows
 * removed optimistically roll back if the bulk action reports failure.
 * Keyboard: j/k move, Enter opens, a/r approve/reject the cursor or selection,
 * Esc clears — ignored while focus is in an input/textarea.
 */
export function SelectableTable<T extends SelectableRow>({
  rows,
  columns,
  emptyState,
  onBulkApprove,
  onBulkReject
}: {
  rows: T[]
  columns: SelectableColumn<T>[]
  emptyState: React.ReactNode
  onBulkApprove: (ids: string[]) => Promise<BulkActionResult>
  onBulkReject: (ids: string[]) => Promise<BulkActionResult>
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [removed, setRemoved] = React.useState<Set<string>>(new Set())
  const [rawCursor, setCursor] = React.useState(0)
  const [pending, setPending] = React.useState(false)

  const visibleRows = React.useMemo(() => rows.filter((row) => !removed.has(row.id)), [rows, removed])
  // Derive the on-screen cursor from the raw index so it stays in bounds as
  // optimistic removals shrink the list — no effect needed to "fix it up".
  const cursor = Math.min(rawCursor, Math.max(visibleRows.length - 1, 0))

  function clearSelection() {
    setSelected(new Set())
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const runBulk = React.useCallback(
    async (ids: string[], action: (ids: string[]) => Promise<BulkActionResult>, successTone: "success" | "danger") => {
      if (ids.length === 0 || pending) return
      setPending(true)
      setRemoved((current) => new Set([...current, ...ids]))
      try {
        const result = await action(ids)
        toast(result.message, result.ok ? successTone : "danger")
        if (result.ok) {
          setSelected((current) => {
            const next = new Set(current)
            ids.forEach((id) => next.delete(id))
            return next
          })
        } else {
          setRemoved((current) => {
            const next = new Set(current)
            ids.forEach((id) => next.delete(id))
            return next
          })
        }
      } catch {
        toast("Something went wrong — please try again.", "danger")
        setRemoved((current) => {
          const next = new Set(current)
          ids.forEach((id) => next.delete(id))
          return next
        })
      } finally {
        setPending(false)
        router.refresh()
      }
    },
    [pending, toast, router]
  )

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      if (visibleRows.length === 0) return

      const cursorRow = visibleRows[cursor]

      switch (event.key) {
        case "j":
          event.preventDefault()
          setCursor(Math.min(cursor + 1, visibleRows.length - 1))
          break
        case "k":
          event.preventDefault()
          setCursor(Math.max(cursor - 1, 0))
          break
        case "Enter":
          if (cursorRow) router.push(cursorRow.href)
          break
        case "a":
          if (cursorRow) {
            event.preventDefault()
            void runBulk(selected.size > 0 ? Array.from(selected) : [cursorRow.id], onBulkApprove, "success")
          }
          break
        case "r":
          if (cursorRow) {
            event.preventDefault()
            void runBulk(selected.size > 0 ? Array.from(selected) : [cursorRow.id], onBulkReject, "danger")
          }
          break
        case "Escape":
          clearSelection()
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [visibleRows, cursor, selected, runBulk, onBulkApprove, onBulkReject, router])

  if (visibleRows.length === 0) {
    return <div className="emptyTableState">{emptyState}</div>
  }

  return (
    <>
      <div className="responsiveTable">
        <table className="adminTable">
          <thead>
            <tr>
              <th className="selectCol" aria-label="Select" />
              {columns.map((col) => (
                <th key={col.key} style={col.align === "end" ? { textAlign: "right" } : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={row.id} style={index === cursor ? { background: "var(--surface-2)" } : undefined}>
                <td className="selectCell" data-label="Select">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    aria-label={`Select row ${index + 1}`}
                  />
                </td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    data-label={col.header}
                    style={col.align === "end" ? { textAlign: "right" } : undefined}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BulkActionBar
        count={selected.size}
        pending={pending}
        onApprove={() => void runBulk(Array.from(selected), onBulkApprove, "success")}
        onReject={() => void runBulk(Array.from(selected), onBulkReject, "danger")}
        onClear={clearSelection}
      />
    </>
  )
}

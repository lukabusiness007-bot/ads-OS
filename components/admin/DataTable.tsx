import type { ReactNode } from "react"

export type DataTableColumn<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  align?: "start" | "end"
}

/**
 * Standard admin list table: roomy `.adminTable` rows that stack into
 * data-label cards on narrow screens via `.responsiveTable`. Server-rendered
 * by default — wrap rows in a client component only when the screen needs
 * selection, keyboard triage, or optimistic updates (see SelectableTable).
 */
export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  empty
}: {
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowKey: (row: T) => string
  empty: ReactNode
}) {
  if (rows.length === 0) {
    return <div className="emptyTableState">{empty}</div>
  }

  return (
    <div className="responsiveTable">
      <table className="adminTable">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.align === "end" ? { textAlign: "right" } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
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
  )
}

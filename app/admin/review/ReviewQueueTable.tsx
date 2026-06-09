"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/StatusBadge"
import { SelectableTable, type SelectableColumn, type BulkActionResult } from "@/components/admin/SelectableTable"
import type { ProductStatus } from "@/lib/types"

export type ReviewQueueRow = {
  id: string
  href: string
  name: string
  orgId: string
  orgName: string
  status: ProductStatus
  photoCount: number
  hasGlb: boolean
  updatedAt: string
}

async function postBulkDecision(
  ids: string[],
  decision: "approved" | "rejected"
): Promise<BulkActionResult> {
  try {
    const res = await fetch("/api/admin/review/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, decision })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, message: data.error ?? "Request failed. Try again." }
    }
    return { ok: Boolean(data.ok), message: data.message ?? "Done." }
  } catch {
    return { ok: false, message: "Network error — please try again." }
  }
}

export function ReviewQueueTable({ rows, emptyState }: {
  rows: ReviewQueueRow[]
  emptyState: ReactNode
}) {
  const columns: SelectableColumn<ReviewQueueRow>[] = [
    {
      key: "product",
      header: "Product",
      cell: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span>
    },
    {
      key: "merchant",
      header: "Merchant",
      cell: (row) => (
        <Link href={`/admin/orgs/${row.orgId}`} className="textLink">
          {row.orgName}
        </Link>
      )
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      key: "photos",
      header: "Photos",
      cell: (row) => <span className="muted">{row.photoCount}</span>
    },
    {
      key: "model",
      header: "Model",
      cell: (row) =>
        row.hasGlb ? (
          <span className="badge success">GLB ready</span>
        ) : (
          <span className="badge neutral">No model</span>
        )
    },
    {
      key: "updated",
      header: "Updated",
      cell: (row) => (
        <span className="muted" style={{ fontSize: 12 }}>
          {new Date(row.updatedAt).toLocaleString()}
        </span>
      )
    },
    {
      key: "inspect",
      header: "",
      align: "end",
      cell: (row) => (
        <Link href={row.href} className="button accent sm">
          Inspect →
        </Link>
      )
    }
  ]

  return (
    <SelectableTable
      rows={rows}
      columns={columns}
      emptyState={emptyState}
      onBulkApprove={(ids) => postBulkDecision(ids, "approved")}
      onBulkReject={(ids) => postBulkDecision(ids, "rejected")}
    />
  )
}

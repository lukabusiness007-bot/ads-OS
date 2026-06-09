"use client"

import { useLang } from "@/lib/lang"
import { statusTone } from "@/lib/ui"
import type { ProductStatus } from "@/lib/types"

export function StatusBadge({ status }: { status: ProductStatus }) {
  const { tr } = useLang()
  const label = tr.statusLabels[status] ?? status.replace(/_/g, " ")
  return <span className={`badge ${statusTone(status)}`}>{label}</span>
}

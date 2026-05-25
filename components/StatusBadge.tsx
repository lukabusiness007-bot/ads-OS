import { statusLabel, statusTone } from "@/lib/ui";
import type { ProductStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ProductStatus }) {
  return <span className={`badge ${statusTone(status)}`}>{statusLabel(status)}</span>;
}

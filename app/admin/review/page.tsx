import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getReviewQueue } from "@/lib/admin/data";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterControls, type FilterTab } from "@/components/admin/FilterControls";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { ReviewQueueTable, type ReviewQueueRow } from "@/app/admin/review/ReviewQueueTable";

const STATUS_TABS: FilterTab[] = [
  { value: "awaiting_review", label: "Awaiting" },
  { value: "generating", label: "Generating" },
  { value: "generation_failed", label: "Failed" },
  { value: "approved", label: "Approved" },
];

const EMPTY_COPY: Record<string, { title: string; body: string }> = {
  awaiting_review: {
    title: "Nothing waiting on you",
    body: "Every generated model has been reviewed. New submissions will land here as soon as they finish generating."
  },
  generating: {
    title: "No models generating right now",
    body: "Products move here while the 3D model is being built. Check back once a merchant kicks off a new generation."
  },
  generation_failed: {
    title: "No failed generations",
    body: "Products land here when model generation errors out and needs a regeneration or a manual look."
  },
  approved: {
    title: "No approved products yet",
    body: "Approved products are live and unlocked for the merchant. Approve a product from the queue to see it here."
  },
};

const PAGE_SIZE = 25;

export default async function AdminReviewQueuePage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const admin = await requirePlatformAdmin("/admin/review");
  if (!admin) return null;

  const { status = "awaiting_review", q = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  const { rows: queue, total } = await getReviewQueue(admin, {
    statusFilter: status,
    search: q,
    page: currentPage,
    pageSize: PAGE_SIZE
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const rows: ReviewQueueRow[] = queue.map(({ product, org, model_asset, photos }) => ({
    id: product.id,
    href: `/admin/review/${product.id}`,
    name: product.name,
    orgId: org.id,
    orgName: org.name,
    status: product.status,
    photoCount: photos.length,
    hasGlb: Boolean(model_asset?.public_glb_url),
    updatedAt: product.updated_at,
  }));

  const copy = EMPTY_COPY[status] ?? EMPTY_COPY.awaiting_review;
  const emptyState = q.trim() ? (
    <>
      <strong>No matches for &ldquo;{q}&rdquo;</strong>
      <p className="muted">Try a different product name, or clear the search to see the full queue.</p>
    </>
  ) : (
    <>
      <strong>{copy.title}</strong>
      <p className="muted">{copy.body}</p>
    </>
  );

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Review queue"
        subtitle={`${total.toLocaleString()} products · Inspect generated 3D models and approve, reject, or request regeneration — select rows for bulk decisions, or use j/k/Enter/a/r to triage with the keyboard.`}
      />

      <FilterControls tabs={STATUS_TABS} tabParam="status" search searchParam="q" searchPlaceholder="Search product name…" />

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <ReviewQueueTable rows={rows} emptyState={emptyState} />
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hrefForPage={(p) => {
          const params = new URLSearchParams({ status, page: String(p) });
          if (q) params.set("q", q);
          return `/admin/review?${params.toString()}`;
        }}
      />
    </>
  );
}

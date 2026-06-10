import type {
  AdminProduct,
  AdminOrg,
  AdminModelAsset,
  AdminReview,
  AdminGenerationJob,
  AdminReviewQueueItem,
  ReviewDecision,
  AutoReviewVerdict,
  ModelPackageCheck
} from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { createPresignedR2GetUrl, publicUrlForKey } from "@/lib/storage/r2";
import { runModelPackageChecks } from "@/lib/generation-pipeline";
import { evaluateArGate } from "@/lib/admin/ar-gate";
import { assertAdmin, db, escapeIlike, pageRange, type Paginated } from "./shared";
import { recordAuditEvent } from "./audit";

export type AdminProductSearchResult = Pick<AdminProduct, "id" | "name" | "status"> & { org_name: string | null };

export async function getReviewQueue(
  admin: User,
  { statusFilter = "awaiting_review", search = "", page = 1, pageSize = 25 }: { statusFilter?: string; search?: string; page?: number; pageSize?: number } = {}
): Promise<Paginated<AdminReviewQueueItem>> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("products")
    .select("*, organizations!inner(id, name)", { count: "exact" })
    .eq("status", statusFilter)
    .order("updated_at", { ascending: true })
    .range(...pageRange(page, pageSize));

  if (search.trim()) {
    query = query.ilike("name", `%${escapeIlike(search.trim())}%`);
  }

  const { data: products, count, error } = await query;

  if (error) throw error;
  if (!products?.length) return { rows: [], total: count ?? 0 };

  const productIds = products.map((p: Record<string, unknown>) => p.id as string);

  const [
    { data: reviews },
    { data: assets },
    { data: jobs },
    { data: photos }
  ] = await Promise.all([
    supabase
      .from("reviews")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("model_assets")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("generation_jobs")
      .select("*")
      .in("product_id", productIds)
      .order("updated_at", { ascending: false }),
    supabase
      .from("product_photos")
      .select("id, product_id, r2_key, angle, file_name")
      .in("product_id", productIds)
  ]);

  const rows = products.map((p: Record<string, unknown>) => ({
    product: p as AdminProduct,
    org: p.organizations as Pick<AdminOrg, "id" | "name">,
    review: (reviews ?? []).find((r: Record<string, unknown>) => r.product_id === p.id) as AdminReview | null ?? null,
    model_asset: (assets ?? []).find((a: Record<string, unknown>) => a.product_id === p.id) as AdminModelAsset | null ?? null,
    latest_job: (jobs ?? []).find((j: Record<string, unknown>) => j.product_id === p.id) as AdminGenerationJob | null ?? null,
    photos: (photos ?? []).filter((ph: Record<string, unknown>) => ph.product_id === p.id) as Array<{ id: string; r2_key: string; angle: string | null; file_name: string }>
  }));

  return { rows, total: count ?? 0 };
}

export async function getProductForReview(
  admin: User,
  productId: string
): Promise<AdminReviewQueueItem & { modelChecks: ModelPackageCheck[]; photoPresignedUrls: string[] }> {
  assertAdmin(admin);
  const supabase = db();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, organizations!inner(id, name)")
    .eq("id", productId)
    .single();

  if (error || !product) throw new Error("Product not found");

  const [
    { data: review },
    { data: asset },
    { data: job },
    { data: photos }
  ] = await Promise.all([
    supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("model_assets")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("generation_jobs")
      .select("*")
      .eq("product_id", productId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("product_photos")
      .select("id, product_id, r2_key, angle, file_name")
      .eq("product_id", productId)
  ]);

  const modelAsset = asset as AdminModelAsset | null;

  // Generate presigned URLs for photos in parallel; skip any that fail.
  const photoPresignedUrls = (
    await Promise.all(
      (photos ?? []).map((photo) =>
        createPresignedR2GetUrl((photo as Record<string, unknown>).r2_key as string).catch(() => null)
      )
    )
  ).filter((url): url is string => url !== null);

  // Derive viewer-ready URLs from R2 keys (falling back to stored public URLs)
  const modelAssetForViewer = modelAsset
    ? {
        glbUrl: (modelAsset.glb_r2_key ? publicUrlForKey(modelAsset.glb_r2_key) : null) ?? modelAsset.public_glb_url ?? "",
        usdzUrl: (modelAsset.usdz_r2_key ? publicUrlForKey(modelAsset.usdz_r2_key) : null) ?? modelAsset.public_usdz_url ?? undefined,
        posterUrl: (modelAsset.poster_r2_key ? publicUrlForKey(modelAsset.poster_r2_key) : null) ?? modelAsset.public_poster_url ?? "",
      }
    : undefined;

  // Run model package checks
  const modelChecks: ModelPackageCheck[] = modelAsset && modelAssetForViewer
    ? runModelPackageChecks({
        ...modelAssetForViewer,
        fileSizeMb: modelAsset.file_size_mb ?? 0,
        triangleCount: modelAsset.triangle_count,
        textureMax: modelAsset.texture_max,
        dimensionsPresent: modelAsset.dimensions_present
      })
    : [];

  return {
    product: product as AdminProduct,
    org: (product as Record<string, unknown>).organizations as Pick<AdminOrg, "id" | "name">,
    review: review as AdminReview | null,
    model_asset: modelAsset,
    modelAssetForViewer,
    latest_job: job as AdminGenerationJob | null,
    photos: (photos ?? []) as Array<{ id: string; r2_key: string; angle: string | null; file_name: string }>,
    modelChecks,
    photoPresignedUrls
  };
}

export async function searchProducts(
  admin: User,
  query: string,
  limit = 5
): Promise<AdminProductSearchResult[]> {
  assertAdmin(admin);
  const supabase = db();

  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, name, status, organizations!inner(name)")
    .ilike("name", `%${escapeIlike(trimmed)}%`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    status: p.status as AdminProduct["status"],
    org_name: (p.organizations as Record<string, unknown> | null)?.name as string | null ?? null
  }));
}

export async function decideReview(
  admin: User,
  productId: string,
  { decision, notes }: ReviewDecision,
  reviewerKind: "human" | "auto" = "human"
): Promise<void> {
  assertAdmin(admin);
  const supabase = db();

  // Fetch organization_id first — also serves as an existence check.
  const { data: productRow, error: productErr } = await supabase
    .from("products")
    .select("organization_id")
    .eq("id", productId)
    .single();
  if (productErr || !productRow) throw new Error("Product not found");

  const { organization_id } = productRow;

  const reviewStatus =
    decision === "approved" ? "approved" :
    decision === "rejected" ? "rejected" :
    "changes_requested";

  const productStatus =
    decision === "approved" ? "approved" :
    decision === "rejected" ? "rejected" :
    "generating";

  const now = new Date().toISOString();

  // All writes are independent — run in parallel. Reviews are append-only:
  // each generation cycle inserts a fresh "pending" row and readers take the
  // latest by created_at. reviews.product_id has no unique constraint, so an
  // upsert keyed on it would be rejected by Postgres.
  const [reviewRes, productRes, jobRes, pageRes] = await Promise.all([
    supabase
      .from("reviews")
      .insert({
        product_id: productId,
        organization_id,
        status: reviewStatus,
        reviewer_id: admin.id,
        reviewer_kind: reviewerKind,
        notes: notes ?? null,
        updated_at: now
      }),
    supabase
      .from("products")
      .update({ status: productStatus, updated_at: now })
      .eq("id", productId),
    decision === "regenerate"
      ? supabase.from("generation_jobs").insert({
          organization_id,
          product_id: productId,
          provider: "meshy",
          status: "queued"
        })
      : Promise.resolve({ error: null }),
    decision === "approved"
      ? supabase
          .from("hosted_pages")
          .update({ status: "ready" })
          .eq("product_id", productId)
          .eq("status", "locked")
      : Promise.resolve({ error: null })
  ]);

  const failedSteps: string[] = [];
  for (const [step, error] of [
    ["review record", reviewRes.error],
    ["product status", productRes.error],
    ["regeneration job", jobRes.error],
    ["hosted page unlock", pageRes.error]
  ] as const) {
    if (!error) continue;
    failedSteps.push(step);
    console.error(`decideReview: ${step} write failed`, {
      productId,
      decision,
      code: error.code,
      message: error.message
    });
  }
  if (failedSteps.length > 0) {
    throw new Error(`Could not save the decision — failed to write: ${failedSteps.join(", ")}.`);
  }

  await recordAuditEvent(admin, {
    action: decision === "regenerate" ? "regenerate" : decision,
    targetType: "product",
    targetId: productId,
    metadata: { notes, reviewerKind, decision }
  });
}

export async function evaluateModelForAutoApproval(
  _admin: User,
  productId: string
): Promise<AutoReviewVerdict> {
  const supabase = db();

  const { data: config } = await supabase
    .from("admin_config")
    .select("value")
    .eq("key", "auto_review_enabled")
    .single();

  if (!config?.value) return "needs_human";

  const { data: asset } = await supabase
    .from("model_assets")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!asset) return "needs_human";

  const checks = runModelPackageChecks({
    glbUrl: ((asset as AdminModelAsset).glb_r2_key ? publicUrlForKey((asset as AdminModelAsset).glb_r2_key!) : null) ?? (asset as AdminModelAsset).public_glb_url ?? "",
    usdzUrl: ((asset as AdminModelAsset).usdz_r2_key ? publicUrlForKey((asset as AdminModelAsset).usdz_r2_key!) : null) ?? (asset as AdminModelAsset).public_usdz_url ?? undefined,
    posterUrl: ((asset as AdminModelAsset).poster_r2_key ? publicUrlForKey((asset as AdminModelAsset).poster_r2_key!) : null) ?? (asset as AdminModelAsset).public_poster_url ?? "",
    fileSizeMb: (asset as AdminModelAsset).file_size_mb ?? 0,
    triangleCount: (asset as AdminModelAsset).triangle_count,
    textureMax: (asset as AdminModelAsset).texture_max,
    dimensionsPresent: (asset as AdminModelAsset).dimensions_present
  });

  const gate = evaluateArGate(checks);
  if (gate.status === "blocked") return "reject";
  if (gate.status === "needs_reason") return "needs_human";

  return "approve";
}

export async function editProductStatus(
  admin: User,
  productId: string,
  newStatus: string,
  reason?: string
): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("products")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", productId);

  await recordAuditEvent(admin, {
    action: "edit_product",
    targetType: "product",
    targetId: productId,
    metadata: { newStatus, reason }
  });
}

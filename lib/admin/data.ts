/**
 * Admin data access layer.
 *
 * ONLY this module may use createServiceRoleSupabaseClient() for admin features.
 * Every exported function re-verifies the caller is a platform admin.
 * Never import or call these functions in browser/client components.
 */

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { createPresignedR2GetUrl, publicUrlForKey } from "@/lib/storage/r2";
import { runModelPackageChecks } from "@/lib/generation-pipeline";
import type {
  AdminOverviewStats,
  AdminUserRow,
  AdminProfile,
  AdminOrg,
  AdminOrgMember,
  AdminSubscription,
  AdminProduct,
  AdminModelAsset,
  AdminReview,
  AdminGenerationJob,
  AdminAuditEntry,
  AdminNotification,
  AdminReviewQueueItem,
  ReviewDecision,
  AutoReviewVerdict,
  ModelPackageCheck
} from "@/lib/types";
import type { User } from "@supabase/supabase-js";

function db() {
  return createServiceRoleSupabaseClient();
}

function assertAdmin(user: User | null) {
  if (!user) throw new Error("Unauthorized: no user");
}

// ─── Overview ────────────────────────────────────────────────────────────────

export async function getAdminOverviewStats(admin: User): Promise<AdminOverviewStats> {
  assertAdmin(admin);
  const supabase = db();
  const now = new Date();
  const ago7d = new Date(now.getTime() - 7 * 86400_000).toISOString();
  const ago30d = new Date(now.getTime() - 30 * 86400_000).toISOString();

  const [
    { count: awaiting_review },
    { count: generating },
    { count: generation_failed },
    { count: published },
    { count: total_merchants },
    { count: new_signups_7d },
    { count: new_signups_30d },
    { data: attentionProducts }
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "awaiting_review"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "generating"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "generation_failed"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_platform_admin", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", ago7d).eq("is_platform_admin", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", ago30d).eq("is_platform_admin", false),
    supabase
      .from("products")
      .select("id, name, status, updated_at, organizations!inner(name)")
      .in("status", ["awaiting_review", "generation_failed"])
      .order("updated_at", { ascending: true })
      .limit(10)
  ]);

  const needs_attention = (attentionProducts ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    status: p.status as AdminOverviewStats["needs_attention"][number]["status"],
    org_name: ((p.organizations as Record<string, unknown>)?.name as string) ?? "",
    updated_at: p.updated_at as string
  }));

  return {
    awaiting_review: awaiting_review ?? 0,
    generating: generating ?? 0,
    generation_failed: generation_failed ?? 0,
    published: published ?? 0,
    total_merchants: total_merchants ?? 0,
    new_signups_7d: new_signups_7d ?? 0,
    new_signups_30d: new_signups_30d ?? 0,
    needs_attention
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(
  admin: User,
  { search = "", status = "all", page = 1, pageSize = 25 }: { search?: string; status?: "all" | "active" | "suspended"; page?: number; pageSize?: number } = {}
): Promise<{ rows: AdminUserRow[]; total: number }> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("profiles")
    .select(
      `id, full_name, email, username, suspended_at, created_at,
       organization_members!inner(
         organization_id, role,
         organizations!inner(name, plan_key, subscriptions(plan_key, status))
       )`,
      { count: "exact" }
    )
    .eq("is_platform_admin", false)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
  }
  if (status === "suspended") {
    query = query.not("suspended_at", "is", null);
  } else if (status === "active") {
    query = query.is("suspended_at", null);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const rows: AdminUserRow[] = (data ?? []).map((p: Record<string, unknown>) => {
    const member = Array.isArray(p.organization_members) ? (p.organization_members[0] as Record<string, unknown>) : null;
    const org = member ? (member.organizations as Record<string, unknown>) : null;
    const subs = org && Array.isArray(org.subscriptions) ? (org.subscriptions[0] as Record<string, unknown>) : null;

    return {
      id: p.id as string,
      full_name: p.full_name as string | null,
      email: p.email as string | null,
      username: p.username as string | null,
      suspended_at: p.suspended_at as string | null,
      created_at: p.created_at as string,
      org_name: org ? (org.name as string) : null,
      org_id: member ? (member.organization_id as string) : null,
      plan_key: subs ? (subs.plan_key as string) : (org ? (org.plan_key as string) : null),
      subscription_status: subs ? (subs.status as string) : null
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getUserDetail(
  admin: User,
  userId: string
): Promise<{
  profile: AdminProfile;
  orgs: Array<AdminOrg & { role: string; subscription: AdminSubscription | null }>;
  products: AdminProduct[];
  recentAudit: AdminAuditEntry[];
}> {
  assertAdmin(admin);
  const supabase = db();

  const [
    { data: profile, error: profileErr },
    { data: memberRows },
    { data: products }
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("organization_members")
      .select("role, organization_id, organizations(*), subscriptions:organizations!inner(subscriptions(*))")
      .eq("user_id", userId),
    supabase
      .from("products")
      .select("*")
      .in(
        "organization_id",
        (
          await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", userId)
        ).data?.map((r: Record<string, unknown>) => r.organization_id as string) ?? []
      )
      .order("updated_at", { ascending: false })
      .limit(50)
  ]);

  if (profileErr || !profile) throw new Error("User not found");

  const orgs = (memberRows ?? []).map((row: Record<string, unknown>) => {
    const org = row.organizations as Record<string, unknown>;
    const subs = Array.isArray(row.subscriptions)
      ? ((row.subscriptions[0] as Record<string, unknown>)?.subscriptions as unknown[] | null)
      : null;
    const sub = Array.isArray(subs) ? (subs[0] as AdminSubscription) : null;
    return { ...(org as AdminOrg), role: row.role as string, subscription: sub };
  });

  const { data: recentAudit } = await supabase
    .from("admin_audit_log")
    .select("*, actor:actor_id(id, full_name, email, username)")
    .eq("target_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    profile: profile as AdminProfile,
    orgs,
    products: (products ?? []) as AdminProduct[],
    recentAudit: (recentAudit ?? []) as AdminAuditEntry[]
  };
}

// ─── Organizations ─────────────────────────────────────────────────────────────

export async function listOrganizations(
  admin: User,
  { search = "", page = 1, pageSize = 25 }: { search?: string; page?: number; pageSize?: number } = {}
): Promise<{ rows: Array<AdminOrg & { member_count: number; product_count: number }>; total: number }> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("organizations")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const orgIds = (data ?? []).map((o: Record<string, unknown>) => o.id as string);

  const [{ data: memberCounts }, { data: productCounts }] = await Promise.all([
    supabase.from("organization_members").select("organization_id").in("organization_id", orgIds),
    supabase.from("products").select("organization_id").in("organization_id", orgIds)
  ]);

  const memberMap: Record<string, number> = {};
  const productMap: Record<string, number> = {};
  (memberCounts ?? []).forEach((r: Record<string, unknown>) => {
    memberMap[r.organization_id as string] = (memberMap[r.organization_id as string] ?? 0) + 1;
  });
  (productCounts ?? []).forEach((r: Record<string, unknown>) => {
    productMap[r.organization_id as string] = (productMap[r.organization_id as string] ?? 0) + 1;
  });

  const rows = (data ?? []).map((o: Record<string, unknown>) => ({
    ...(o as AdminOrg),
    member_count: memberMap[o.id as string] ?? 0,
    product_count: productMap[o.id as string] ?? 0
  }));

  return { rows, total: count ?? 0 };
}

export async function getOrganizationDetail(
  admin: User,
  orgId: string
): Promise<{
  org: AdminOrg;
  members: AdminOrgMember[];
  subscription: AdminSubscription | null;
  products: AdminProduct[];
  recentAudit: AdminAuditEntry[];
}> {
  assertAdmin(admin);
  const supabase = db();

  const [
    { data: org, error: orgErr },
    { data: members },
    { data: subscription },
    { data: products }
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).single(),
    supabase
      .from("organization_members")
      .select("*, profile:user_id(id, full_name, email, username, suspended_at)")
      .eq("organization_id", orgId),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("*")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })
  ]);

  if (orgErr || !org) throw new Error("Organization not found");

  const { data: recentAudit } = await supabase
    .from("admin_audit_log")
    .select("*, actor:actor_id(id, full_name, email, username)")
    .eq("target_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    org: org as AdminOrg,
    members: (members ?? []) as AdminOrgMember[],
    subscription: subscription as AdminSubscription | null,
    products: (products ?? []) as AdminProduct[],
    recentAudit: (recentAudit ?? []) as AdminAuditEntry[]
  };
}

// ─── Review queue ─────────────────────────────────────────────────────────────

export async function getReviewQueue(
  admin: User,
  { statusFilter = "awaiting_review" }: { statusFilter?: string } = {}
): Promise<AdminReviewQueueItem[]> {
  assertAdmin(admin);
  const supabase = db();

  const { data: products, error } = await supabase
    .from("products")
    .select("*, organizations!inner(id, name)")
    .eq("status", statusFilter)
    .order("updated_at", { ascending: true });

  if (error) throw error;
  if (!products?.length) return [];

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

  return products.map((p: Record<string, unknown>) => ({
    product: p as AdminProduct,
    org: p.organizations as Pick<AdminOrg, "id" | "name">,
    review: (reviews ?? []).find((r: Record<string, unknown>) => r.product_id === p.id) as AdminReview | null ?? null,
    model_asset: (assets ?? []).find((a: Record<string, unknown>) => a.product_id === p.id) as AdminModelAsset | null ?? null,
    latest_job: (jobs ?? []).find((j: Record<string, unknown>) => j.product_id === p.id) as AdminGenerationJob | null ?? null,
    photos: (photos ?? []).filter((ph: Record<string, unknown>) => ph.product_id === p.id) as Array<{ id: string; r2_key: string; angle: string | null; file_name: string }>
  }));
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

  // Generate presigned URLs for photos
  const photoPresignedUrls: string[] = [];
  for (const photo of photos ?? []) {
    try {
      const url = await createPresignedR2GetUrl((photo as Record<string, unknown>).r2_key as string);
      photoPresignedUrls.push(url);
    } catch {
      // Skip photos that can't be signed
    }
  }

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

// ─── Review decisions ─────────────────────────────────────────────────────────

export async function decideReview(
  admin: User,
  productId: string,
  { decision, notes, reviewerId }: ReviewDecision,
  reviewerKind: "human" | "auto" = "human"
): Promise<void> {
  assertAdmin(admin);
  const supabase = db();

  // Map decision to product + review status
  const reviewStatus =
    decision === "approved" ? "approved" :
    decision === "rejected" ? "rejected" :
    "changes_requested";

  const productStatus =
    decision === "approved" ? "approved" :
    decision === "rejected" ? "rejected" :
    "generating"; // regenerate → reset to generating

  await supabase
    .from("reviews")
    .upsert(
      {
        product_id: productId,
        organization_id: (
          await supabase
            .from("products")
            .select("organization_id")
            .eq("id", productId)
            .single()
        ).data?.organization_id,
        status: reviewStatus,
        reviewer_id: reviewerId,
        reviewer_kind: reviewerKind,
        notes: notes ?? null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "product_id" }
    );

  await supabase
    .from("products")
    .update({ status: productStatus, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (decision === "regenerate") {
    const { data: product } = await supabase
      .from("products")
      .select("organization_id")
      .eq("id", productId)
      .single();

    if (product) {
      await supabase.from("generation_jobs").insert({
        organization_id: product.organization_id,
        product_id: productId,
        provider: "meshy",
        status: "queued"
      });
    }
  }

  // If approved: unlock hosted page
  if (decision === "approved") {
    await supabase
      .from("hosted_pages")
      .update({ status: "ready" })
      .eq("product_id", productId)
      .eq("status", "locked");
  }

  await recordAuditEvent(admin, {
    action: decision === "regenerate" ? "regenerate" : decision,
    targetType: "product",
    targetId: productId,
    metadata: { notes, reviewerKind, decision }
  });
}

// ─── Automation seam ──────────────────────────────────────────────────────────

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

  const hasFail = checks.some((c) => c.status === "fail");
  if (hasFail) return "reject";

  const hasWarning = checks.some((c) => c.status === "warning");
  if (hasWarning) return "needs_human";

  return "approve";
}

// ─── Power actions ────────────────────────────────────────────────────────────

export async function suspendUser(admin: User, targetUserId: string, reason?: string): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("profiles")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", targetUserId);

  await recordAuditEvent(admin, {
    action: "suspend",
    targetType: "user",
    targetId: targetUserId,
    metadata: { reason }
  });
}

export async function unsuspendUser(admin: User, targetUserId: string): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("profiles")
    .update({ suspended_at: null })
    .eq("id", targetUserId);

  await recordAuditEvent(admin, {
    action: "unsuspend",
    targetType: "user",
    targetId: targetUserId,
    metadata: {}
  });
}

export async function suspendOrg(admin: User, orgId: string, reason?: string): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("organizations")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", orgId);

  await recordAuditEvent(admin, {
    action: "suspend",
    targetType: "organization",
    targetId: orgId,
    metadata: { reason }
  });
}

export async function unsuspendOrg(admin: User, orgId: string): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("organizations")
    .update({ suspended_at: null })
    .eq("id", orgId);

  await recordAuditEvent(admin, {
    action: "unsuspend",
    targetType: "organization",
    targetId: orgId,
    metadata: {}
  });
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

export async function editOrgPlan(
  admin: User,
  orgId: string,
  planKey: string,
  reason?: string
): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("organizations")
    .update({ plan_key: planKey })
    .eq("id", orgId);

  await recordAuditEvent(admin, {
    action: "edit_plan",
    targetType: "organization",
    targetId: orgId,
    metadata: { planKey, reason }
  });
}

// ─── Impersonation ────────────────────────────────────────────────────────────

export async function startImpersonation(admin: User, targetUserId: string): Promise<string> {
  assertAdmin(admin);
  // We issue a short-lived token stored server-side in admin_audit_log; the UI
  // reads org data via the service role on behalf of the target user.
  // Never creates real credentials for the target user.
  const token = crypto.randomUUID();

  await recordAuditEvent(admin, {
    action: "impersonate_start",
    targetType: "user",
    targetId: targetUserId,
    metadata: { token }
  });

  return token;
}

export async function stopImpersonation(admin: User, targetUserId: string): Promise<void> {
  assertAdmin(admin);
  await recordAuditEvent(admin, {
    action: "impersonate_stop",
    targetType: "user",
    targetId: targetUserId,
    metadata: {}
  });
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function recordAuditEvent(
  admin: User,
  {
    action,
    targetType,
    targetId,
    metadata
  }: { action: string; targetType: string; targetId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  const supabase = db();
  await supabase.from("admin_audit_log").insert({
    actor_id: admin.id,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    metadata: metadata ?? {}
  });
}

export async function listAuditLog(
  admin: User,
  {
    action,
    targetType,
    targetId,
    actorId,
    page = 1,
    pageSize = 50
  }: {
    action?: string;
    targetType?: string;
    targetId?: string;
    actorId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{ rows: AdminAuditEntry[]; total: number }> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("admin_audit_log")
    .select("*, actor:actor_id(id, full_name, email, username)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (action) query = query.eq("action", action);
  if (targetType) query = query.eq("target_type", targetType);
  if (targetId) query = query.eq("target_id", targetId);
  if (actorId) query = query.eq("actor_id", actorId);

  const { data, count, error } = await query;
  if (error) throw error;

  return { rows: (data ?? []) as AdminAuditEntry[], total: count ?? 0 };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function listAdminNotifications(
  admin: User,
  { unreadOnly = false }: { unreadOnly?: boolean } = {}
): Promise<AdminNotification[]> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("admin_notifications")
    .select("*, product:product_id(id, name, status)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data } = await query;
  return (data ?? []) as AdminNotification[];
}

export async function markNotificationsRead(admin: User, ids: string[]): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase.from("admin_notifications").update({ read: true }).in("id", ids);
}

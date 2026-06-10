import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureCurrentOrganization } from "@/lib/supabase/data";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasModelBuyout, recordBuyoutExport } from "@/lib/billing/buyout";
import {
  createPresignedModelDownloadUrl,
  deriveSourceGlbKey,
  modelObjectExists
} from "@/lib/storage/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ productId: string }> };

const paramsSchema = z.object({ productId: z.uuid() });

/**
 * GET /api/model/<productId>/export
 *
 * Plan 2, step 6 — the paid buyout export. Hands back the clean, watermark-free
 * GLB, but only to an authenticated merchant who (a) owns the product and (b)
 * has paid for the buyout. Every export is logged. The download is a short-lived
 * presigned attachment URL minted just-in-time, never a permanent link.
 */
export async function GET(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { productId } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`buyout-export:${user.id}`, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const organizationResult = await ensureCurrentOrganization(supabase);
  if (organizationResult.status !== "ready") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const organization = organizationResult.organization;

  // Ownership — RLS also scopes this, but we filter explicitly. 404 (not 403)
  // avoids confirming whether a product id exists for another org.
  const { data: product } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", productId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Payment gate.
  const paid = await hasModelBuyout(supabase, organization.id, productId);
  if (!paid) {
    return NextResponse.json({ error: "payment_required" }, { status: 402 });
  }

  const { data: asset } = await supabase
    .from("model_assets")
    .select("glb_r2_key")
    .eq("organization_id", organization.id)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const glbKey = (asset as { glb_r2_key?: string | null } | null)?.glb_r2_key;
  if (!glbKey) {
    // No R2-backed file to export (e.g. legacy public-URL-only asset).
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Prefer the clean pre-watermark source; fall back to the served file when no
  // source backup exists (optimization was skipped, so the served file is itself
  // the clean, un-watermarked original).
  const sourceKey = deriveSourceGlbKey(glbKey);
  const usingSource = await modelObjectExists(sourceKey);
  const exportKey = usingSource ? sourceKey : glbKey;

  const filename = `${slugifyFilename((product as { name?: string }).name)}.glb`;

  let downloadUrl: string;
  try {
    downloadUrl = await createPresignedModelDownloadUrl(exportKey, filename);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }

  // Audit the export (best-effort — never block the download on the log write).
  await recordBuyoutExport(supabase, organization.id, productId, {
    source: usingSource ? "model-source" : "served",
    at: new Date().toISOString()
  }).catch(() => undefined);

  return NextResponse.redirect(downloadUrl, {
    status: 302,
    headers: { "Cache-Control": "private, no-store, max-age=0" }
  });
}

function slugifyFilename(name: string | undefined): string {
  const slug = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "model";
}

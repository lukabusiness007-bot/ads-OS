import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentOrganization } from "@/lib/supabase/data";
import { loadAdminProfile } from "@/lib/supabase/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { createArPreviewToken } from "@/lib/ar-preview-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  productId: z.uuid()
});

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`ar-preview-token:${user.id}`, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ productId: searchParams.get("productId") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  const { productId } = parsed.data;

  const authorized = await canAccessProduct(supabase, productId);
  if (!authorized) {
    // 404 (not 403) avoids confirming whether a given product id exists.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = createArPreviewToken(productId);
  return NextResponse.json({ token, path: `/ar-preview/${token}` });
}

async function canAccessProduct(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  productId: string
): Promise<boolean> {
  const adminProfile = await loadAdminProfile();
  if (adminProfile?.is_platform_admin && !adminProfile.suspended_at) {
    const admin = createServiceRoleSupabaseClient();
    const { data } = await admin.from("products").select("id").eq("id", productId).maybeSingle();
    if (data) return true;
  }

  const organization = await getCurrentOrganization(supabase);
  if (!organization) return false;

  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  return Boolean(data);
}

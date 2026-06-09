import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureCurrentOrganization } from "@/lib/supabase/data";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
  isSupabaseServiceRoleConfigured
} from "@/lib/supabase/server";
import { getGenerationUsageSummary } from "@/lib/billing/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current org's generation allowance for the active billing period. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ errorMessage: "Sign in is required." }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const organizationResult = await ensureCurrentOrganization(supabase);

  if (organizationResult.status === "unauthenticated") {
    return NextResponse.json({ errorMessage: "Sign in to view usage." }, { status: 401 });
  }

  if (organizationResult.status === "setup_failed") {
    return NextResponse.json({ errorMessage: organizationResult.errorMessage }, { status: 500 });
  }

  const organization = organizationResult.organization;
  const client = isSupabaseServiceRoleConfigured() ? createServiceRoleSupabaseClient() : supabase;
  const summary = await getGenerationUsageSummary(client, organization.id, organization.planKey);

  // Replace non-JSON Infinity (unlimited plans) with null for the wire.
  return NextResponse.json({
    ...summary,
    includedRemaining: Number.isFinite(summary.includedRemaining) ? summary.includedRemaining : null,
    totalRemaining: Number.isFinite(summary.totalRemaining) ? summary.totalRemaining : null
  });
}

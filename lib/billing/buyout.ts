// Plan 2, step 6 — model file buyout entitlements + export audit.
//
// Reuses the existing `usage_events` table (no new schema): a buyout is a
// `model_buyout` row scoped to (organization_id, product_id); each clean-file
// export writes a `model_buyout_export` audit row. Entitlement is simply "a
// model_buyout row exists for this org+product".

import type { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type AnySupabaseClient =
  | Awaited<ReturnType<typeof createServerSupabaseClient>>
  | ReturnType<typeof createServiceRoleSupabaseClient>;

export const MODEL_BUYOUT_EVENT = "model_buyout";
export const MODEL_BUYOUT_EXPORT_EVENT = "model_buyout_export";

/**
 * Record a paid buyout (called from the Stripe webhook on payment). Idempotent
 * on the Stripe checkout session id, since Stripe retries webhook deliveries.
 */
export async function recordModelBuyout(
  client: AnySupabaseClient,
  organizationId: string,
  productId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const sessionId =
    typeof (metadata as { sessionId?: unknown }).sessionId === "string"
      ? (metadata as { sessionId: string }).sessionId
      : null;

  if (sessionId) {
    const { data: existing } = await client
      .from("usage_events")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("event_type", MODEL_BUYOUT_EVENT)
      .filter("metadata->>sessionId", "eq", sessionId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return;
    }
  }

  await client.from("usage_events").insert({
    organization_id: organizationId,
    product_id: productId,
    event_type: MODEL_BUYOUT_EVENT,
    quantity: 1,
    metadata
  });
}

/** Whether the org has paid to buy out the given product's file. */
export async function hasModelBuyout(
  client: AnySupabaseClient,
  organizationId: string,
  productId: string
): Promise<boolean> {
  const { data } = await client
    .from("usage_events")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .eq("event_type", MODEL_BUYOUT_EVENT)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

/** Append an audit row each time the clean file is exported. */
export async function recordBuyoutExport(
  client: AnySupabaseClient,
  organizationId: string,
  productId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await client.from("usage_events").insert({
    organization_id: organizationId,
    product_id: productId,
    event_type: MODEL_BUYOUT_EXPORT_EVENT,
    quantity: 1,
    metadata
  });
}

import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/email/client";
import { sendAnalyticsDigestEmail } from "@/lib/email/send";
import { getUnsubscribeUrl } from "@/lib/email/unsubscribe";
import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const WINDOW_DAYS = 7;

const EVENT_LABELS: { type: string; label: string }[] = [
  { type: "page_view", label: "Page views" },
  { type: "ar_button_click", label: "AR launches" },
  { type: "cta_click", label: "Store clicks" },
  { type: "viewer_interaction", label: "3D interactions" }
];

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ errorMessage: "Set CRON_SECRET to enable the digest." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ errorMessage: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ errorMessage: "Digest requires the Supabase service role key." }, { status: 500 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rangeLabel = formatRange(since, new Date());

  const { data: orgs, error } = await supabase.from("organizations").select("id, name");
  if (error) {
    return NextResponse.json({ errorMessage: "Could not load organizations." }, { status: 500 });
  }

  let sent = 0;

  for (const org of orgs ?? []) {
    const owner = await getOptedInOwner(supabase, org.id);
    if (!owner) continue;

    const { data: events } = await supabase
      .from("analytics_events")
      .select("event_type")
      .eq("organization_id", org.id)
      .gte("created_at", since.toISOString());

    const { count: newModels } = await supabase
      .from("model_assets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .gte("created_at", since.toISOString());

    const counts = new Map<string, number>();
    for (const row of events ?? []) {
      counts.set(row.event_type, (counts.get(row.event_type) ?? 0) + 1);
    }

    const total = (events ?? []).length + (newModels ?? 0);
    if (total === 0) continue; // Skip orgs with no activity this week.

    const stats = [
      ...EVENT_LABELS.map((e) => ({ label: e.label, value: (counts.get(e.type) ?? 0).toLocaleString() })),
      { label: "New models", value: (newModels ?? 0).toLocaleString() }
    ];

    await sendAnalyticsDigestEmail(owner.email, {
      organizationName: org.name,
      rangeLabel,
      stats,
      dashboardUrl: `${getSiteUrl()}/analytics`,
      unsubscribeUrl: getUnsubscribeUrl(owner.email)
    }).catch(() => undefined);

    sent += 1;
  }

  return NextResponse.json({ sent, rangeLabel });
}

async function getOptedInOwner(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string
): Promise<{ email: string } | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("profiles(email, marketing_consent)")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const email = (profile as { email?: string | null } | null)?.email;
  const consent = (profile as { marketing_consent?: boolean | null } | null)?.marketing_consent;

  if (!email || consent === false) return null;
  return { email };
}

function formatRange(start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

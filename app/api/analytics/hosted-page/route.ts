import { NextResponse } from "next/server";
import { recordHostedPageEvent } from "@/lib/supabase/data";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import type { HostedPageAnalyticsEvent } from "@/lib/types";

const allowedEvents = new Set<HostedPageAnalyticsEvent>([
  "page_view",
  "viewer_interaction",
  "ar_button_click",
  "cta_click"
]);

export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const { allowed } = await checkRateLimit(`analytics-beacon:${ip}`, 120, 60);
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const payload = (await request.json().catch(() => null)) as {
    merchantSlug?: string;
    productSlug?: string;
    event?: HostedPageAnalyticsEvent;
    deviceType?: string;
    metadata?: Record<string, unknown>;
  } | null;

  if (!payload?.merchantSlug || !payload.productSlug || !payload.event || !allowedEvents.has(payload.event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await recordHostedPageEvent({
    merchantSlug: payload.merchantSlug,
    productSlug: payload.productSlug,
    eventType: payload.event,
    deviceType: payload.deviceType,
    referrer: request.headers.get("referer") ?? undefined,
    metadata: payload.metadata
  });

  return NextResponse.json(result);
}

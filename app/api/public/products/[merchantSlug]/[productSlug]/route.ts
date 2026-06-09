import { NextResponse } from "next/server";
import { getPublishedProduct } from "@/lib/supabase/data";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import type { ModelAsset } from "@/lib/types";

export const dynamic = "force-dynamic";

const CORS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

type RouteParams = { params: Promise<{ merchantSlug: string; productSlug: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const ip = clientIpFromHeaders(request.headers);
  const { allowed } = await checkRateLimit(`public-product:${ip}`, 120, 60);
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  }

  const { merchantSlug, productSlug } = await params;

  const product = await getPublishedProduct(merchantSlug, productSlug);

  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: CORS });
  }

  const modelAsset: ModelAsset | null = product.modelAsset ?? null;

  return NextResponse.json(
    {
      id: product.id,
      name: product.name,
      brandName: product.brandName,
      description: product.description ?? "",
      modelAsset,
    },
    { headers: CORS }
  );
}

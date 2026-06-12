import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { editProductStatus } from "@/lib/admin/data";

const statusSchema = z.object({
  status: z.enum([
    "draft",
    "photos_uploaded",
    "generating",
    "generation_failed",
    "awaiting_review",
    "approved",
    "rejected",
    "published",
    "unpublished"
  ]),
  reason: z.string().max(2000).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const { productId } = await params;

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const { status, reason } = parsed.data;

  try {
    await editProductStatus(verify.user, productId, status, reason?.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

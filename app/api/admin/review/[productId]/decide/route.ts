import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { decideReview } from "@/lib/admin/data";

const decideSchema = z.object({
  decision: z.enum(["approved", "rejected", "regenerate"]),
  notes: z.string().max(5000).optional()
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

  const parsed = decideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }
  const { decision, notes } = parsed.data;

  try {
    // reviewerId is derived from the authenticated admin session (verify.user),
    // never trusted from the request body.
    await decideReview(
      verify.user,
      productId,
      {
        decision,
        notes: notes?.trim()
      },
      "human"
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

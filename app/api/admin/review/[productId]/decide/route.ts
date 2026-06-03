import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { decideReview } from "@/lib/admin/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const { productId } = await params;

  let body: { decision?: string; notes?: string; reviewerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { decision, notes, reviewerId } = body;

  if (!["approved", "rejected", "regenerate"].includes(decision ?? "")) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  if (!reviewerId) {
    return NextResponse.json({ error: "reviewerId required" }, { status: 400 });
  }

  try {
    await decideReview(
      verify.user,
      productId,
      {
        decision: decision as "approved" | "rejected" | "regenerate",
        notes: notes?.trim(),
        reviewerId
      },
      "human"
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

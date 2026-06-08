import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { decideReview } from "@/lib/admin/data";

export async function POST(request: Request) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  let body: { ids?: string[]; decision?: string; reviewerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ids, decision, reviewerId } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  if (!reviewerId) {
    return NextResponse.json({ error: "reviewerId required" }, { status: 400 });
  }

  let succeeded = 0;
  let failed = 0;

  for (const productId of ids) {
    try {
      await decideReview(verify.user, productId, { decision, reviewerId }, "human");
      succeeded += 1;
    } catch {
      failed += 1;
    }
  }

  const verb = decision === "approved" ? "approved" : "rejected";
  const message =
    failed === 0
      ? `${succeeded} ${succeeded === 1 ? "product" : "products"} ${verb}.`
      : succeeded === 0
        ? `Couldn't ${decision === "approved" ? "approve" : "reject"} any of the selected products.`
        : `${succeeded} ${verb}, ${failed} failed — try the rest again.`;

  return NextResponse.json({ ok: failed === 0, succeeded, failed, message });
}

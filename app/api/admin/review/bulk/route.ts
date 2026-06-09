import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { decideReview } from "@/lib/admin/data";

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  decision: z.enum(["approved", "rejected"])
});

export async function POST(request: Request) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ids and a valid decision are required" }, { status: 400 });
  }
  const { ids, decision } = parsed.data;

  let succeeded = 0;
  let failed = 0;

  const CHUNK = 5;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    // reviewer derived from the authenticated admin session, not the body.
    const results = await Promise.allSettled(
      chunk.map((productId) => decideReview(verify.user, productId, { decision }, "human"))
    );
    for (const r of results) {
      if (r.status === "fulfilled") succeeded += 1;
      else failed += 1;
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

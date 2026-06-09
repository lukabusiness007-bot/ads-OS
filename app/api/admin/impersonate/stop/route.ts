import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { stopImpersonation } from "@/lib/admin/data";

const bodySchema = z.object({ targetUserId: z.string().trim().uuid() });

export async function POST(request: Request) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }
  const { targetUserId } = parsed.data;

  try {
    await stopImpersonation(verify.user, targetUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

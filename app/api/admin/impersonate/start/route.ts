import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { startImpersonation } from "@/lib/admin/data";

export async function POST(request: Request) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  let targetUserId: string;
  try {
    const body = await request.json();
    targetUserId = String(body.targetUserId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }

  try {
    const token = await startImpersonation(verify.user, targetUserId);
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

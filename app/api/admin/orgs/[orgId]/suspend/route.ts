import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { suspendOrg } from "@/lib/admin/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const { orgId } = await params;
  const body = await request.json().catch(() => ({})) as { reason?: string };

  try {
    await suspendOrg(verify.user, orgId, body.reason);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { unsuspendUser } from "@/lib/admin/data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const { userId } = await params;

  try {
    await unsuspendUser(verify.user, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

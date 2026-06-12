import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { getAdminConfig, setAutoReviewEnabled } from "@/lib/admin/data";

export async function GET() {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  try {
    const config = await getAdminConfig(verify.user);
    return NextResponse.json(config);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const body = (await request.json().catch(() => ({}))) as { autoReviewEnabled?: boolean };
  if (typeof body.autoReviewEnabled !== "boolean") {
    return NextResponse.json({ error: "autoReviewEnabled must be a boolean" }, { status: 400 });
  }

  try {
    await setAutoReviewEnabled(verify.user, body.autoReviewEnabled);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let username: string;
  try {
    const body = await request.json();
    username = String(body?.username ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const admin = createServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("username", username)
    .single();

  if (error || !data?.email) {
    // Return a generic message to avoid username enumeration
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ email: data.email });
}

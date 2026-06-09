import { unsubscribeContact } from "@/lib/email/contacts";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function processUnsubscribe(token: string | undefined): Promise<"ok" | "invalid" | "error"> {
  if (!token) return "invalid";
  const email = verifyUnsubscribeToken(token);
  if (!email) return "invalid";

  try {
    if (isSupabaseServiceRoleConfigured()) {
      const admin = createServiceRoleSupabaseClient();
      await admin
        .from("profiles")
        .update({ marketing_consent: false, marketing_consent_updated_at: new Date().toISOString() })
        .eq("email", email);
    }
    await unsubscribeContact(email);
    return "ok";
  } catch {
    return "error";
  }
}

export default async function UnsubscribePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await processUnsubscribe(token);

  const message =
    result === "ok"
      ? "You've been unsubscribed from Augmenta marketing emails. You'll still receive important account and transactional messages."
      : result === "invalid"
        ? "This unsubscribe link is invalid or has expired."
        : "Something went wrong. Please try again later or contact support.";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif", background: "#f4f5f3" }}>
      <div style={{ maxWidth: 460, background: "#fff", border: "1px solid #e7e9e6", borderRadius: 14, padding: 32, textAlign: "center" }}>
        <p style={{ color: "#0f7a52", fontWeight: 800, fontSize: 20, margin: "0 0 12px" }}>Augmenta</p>
        <h1 style={{ fontSize: 20, margin: "0 0 10px", color: "#1a1a1a" }}>
          {result === "ok" ? "Unsubscribed" : "Unsubscribe"}
        </h1>
        <p style={{ color: "#555", lineHeight: "22px", margin: 0 }}>{message}</p>
      </div>
    </main>
  );
}

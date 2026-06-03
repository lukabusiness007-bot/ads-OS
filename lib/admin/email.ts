/**
 * Best-effort admin email notifications via Resend.
 * Never throws — email failure must never block the caller's operation.
 */

type AdminEmailPayload = {
  productId: string;
  productName: string;
  merchantName: string;
  action: "awaiting_review" | "generation_failed";
};

export async function sendAdminNotificationEmail(payload: AdminEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !to) return; // Not configured — skip silently

  const subject =
    payload.action === "awaiting_review"
      ? `[Veridian] Model ready for review: ${payload.productName}`
      : `[Veridian] Generation failed: ${payload.productName}`;

  const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://veridianar.com"}/admin/review/${payload.productId}`;

  const html = `
    <h2>${subject}</h2>
    <p><strong>Product:</strong> ${payload.productName}</p>
    <p><strong>Merchant:</strong> ${payload.merchantName}</p>
    <p><strong>Status:</strong> ${payload.action.replaceAll("_", " ")}</p>
    <p><a href="${reviewUrl}">Open review inspector →</a></p>
    <hr/>
    <p style="color:#888;font-size:12px">Veridian Admin · Internal only</p>
  `.trim();

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Veridian Admin <noreply@veridianar.com>",
        to,
        subject,
        html
      })
    });
  } catch {
    // Best-effort: swallow all errors
  }
}

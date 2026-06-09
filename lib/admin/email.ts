/**
 * Best-effort admin email notifications via Resend.
 * Never throws — email failure must never block the caller's operation.
 */

import { getSiteUrl } from "@/lib/email/client";
import { sendAdminNotificationEmail as sendAdminEmail } from "@/lib/email/send";

type AdminEmailPayload = {
  productId: string;
  productName: string;
  merchantName: string;
  action: "awaiting_review" | "generation_failed";
};

export async function sendAdminNotificationEmail(payload: AdminEmailPayload): Promise<void> {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!to) return; // No admin recipient configured — skip silently.

  await sendAdminEmail({
    to,
    productName: payload.productName,
    merchantName: payload.merchantName,
    action: payload.action,
    reviewUrl: `${getSiteUrl()}/admin/review/${payload.productId}`
  });
}

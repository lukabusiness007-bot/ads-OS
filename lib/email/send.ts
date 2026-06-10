import { AdminNotificationEmail, type AdminNotificationEmailProps } from "@/emails/AdminNotificationEmail";
import { AnalyticsDigestEmail, type AnalyticsDigestEmailProps } from "@/emails/AnalyticsDigestEmail";
import { GenerationFailedEmail } from "@/emails/GenerationFailedEmail";
import { GenerationReadyEmail } from "@/emails/GenerationReadyEmail";
import { ReceiptEmail, type ReceiptEmailProps } from "@/emails/ReceiptEmail";
import { SubscriptionEmail, type SubscriptionEmailProps } from "@/emails/SubscriptionEmail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { getSiteUrl, sendEmail } from "./client";

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Welcome to Augmenta",
    react: WelcomeEmail({ name, dashboardUrl: `${getSiteUrl()}/dashboard` })
  });
}

export async function sendGenerationReadyEmail(to: string, productName: string): Promise<void> {
  await sendEmail({
    to,
    subject: `Your 3D model for ${productName} is ready`,
    react: GenerationReadyEmail({ productName, dashboardUrl: `${getSiteUrl()}/dashboard` })
  });
}

export async function sendGenerationFailedEmail(to: string, productName: string, reason?: string): Promise<void> {
  await sendEmail({
    to,
    subject: `We couldn't finish the model for ${productName}`,
    react: GenerationFailedEmail({ productName, dashboardUrl: `${getSiteUrl()}/dashboard`, reason })
  });
}

export async function sendReceiptEmail(to: string, props: ReceiptEmailProps): Promise<void> {
  await sendEmail({
    to,
    subject: `Your Augmenta receipt — ${props.amount}`,
    react: ReceiptEmail(props)
  });
}

export async function sendSubscriptionEmail(to: string, props: SubscriptionEmailProps): Promise<void> {
  const subjects: Record<SubscriptionEmailProps["change"], string> = {
    renewed: "Your Augmenta subscription renewed",
    updated: "Your Augmenta plan was updated",
    canceled: "Your Augmenta subscription was canceled",
    trial_ending: "Your Augmenta trial is ending soon",
    payment_failed: "Action needed: your Augmenta payment failed"
  };
  await sendEmail({ to, subject: subjects[props.change], react: SubscriptionEmail(props) });
}

export async function sendAnalyticsDigestEmail(to: string, props: AnalyticsDigestEmailProps): Promise<void> {
  await sendEmail({
    to,
    subject: `${props.organizationName} — your AR performance for ${props.rangeLabel}`,
    react: AnalyticsDigestEmail(props)
  });
}

export async function sendAdminNotificationEmail(props: AdminNotificationEmailProps & { to: string }): Promise<void> {
  const { to, ...rest } = props;
  const subject =
    rest.action === "awaiting_review"
      ? `[Augmenta] Model ready for review: ${rest.productName}`
      : `[Augmenta] Generation failed: ${rest.productName}`;
  await sendEmail({ to, subject, react: AdminNotificationEmail(rest) });
}

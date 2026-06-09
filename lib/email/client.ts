import type { ReactElement } from "react";
import { Resend } from "resend";

/**
 * Shared Resend client + best-effort send wrapper.
 * Email is never allowed to block or throw into the caller — a failed send
 * must not break signup, generation, billing, or cron flows.
 */

let cachedClient: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

export function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "Augmenta <noreply@veridianar.com>";
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://veridianar.com";
}

type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
};

export async function sendEmail({ to, subject, react, replyTo }: SendEmailInput): Promise<void> {
  const client = getResendClient();
  if (!client) return; // Not configured — skip silently.

  try {
    const { error } = await client.emails.send({
      from: getFromAddress(),
      to,
      subject,
      react,
      replyTo
    });
    if (error) {
      console.warn("Resend send returned an error", { subject, error });
    }
  } catch (error) {
    console.warn("Resend send threw", { subject, error });
  }
}

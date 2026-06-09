import { getResendClient } from "./client";

/**
 * Resend Audience contact sync for marketing broadcasts.
 * Best-effort — never throws. Returns the contact id when known.
 */

function audienceId(): string | undefined {
  return process.env.RESEND_AUDIENCE_ID;
}

export async function syncContactToResend(input: {
  email: string;
  name?: string | null;
  subscribed: boolean;
}): Promise<string | null> {
  const client = getResendClient();
  const aud = audienceId();
  if (!client || !aud) return null;

  const [firstName, ...rest] = (input.name ?? "").trim().split(" ");

  try {
    const { data, error } = await client.contacts.create({
      audienceId: aud,
      email: input.email,
      firstName: firstName || undefined,
      lastName: rest.length ? rest.join(" ") : undefined,
      unsubscribed: !input.subscribed
    });
    if (error) {
      console.warn("Resend contact sync error", { email: input.email, error });
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.warn("Resend contact sync threw", { email: input.email, error });
    return null;
  }
}

export async function unsubscribeContact(email: string): Promise<void> {
  const client = getResendClient();
  const aud = audienceId();
  if (!client || !aud) return;

  try {
    await client.contacts.update({ audienceId: aud, email, unsubscribed: true });
  } catch (error) {
    console.warn("Resend unsubscribe threw", { email, error });
  }
}

"use client";

// Client-side helpers that call the billing API routes and redirect the browser
// to Stripe Checkout / the billing portal. Safe to import from client components.

type CheckoutBody = { plan?: string; topup?: string; withSetupFee?: boolean };

async function postJson(url: string, body?: unknown): Promise<{ url?: string; errorMessage?: string }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  return response.json().catch(() => ({ errorMessage: "Unexpected response." }));
}

/** Start a plan or top-up checkout; redirects to Stripe on success. Returns an error string otherwise. */
export async function startBillingCheckout(body: CheckoutBody): Promise<string | null> {
  const result = await postJson("/api/billing/checkout", body);
  if (result.url) {
    window.location.href = result.url;
    return null;
  }
  return result.errorMessage ?? "Could not start checkout.";
}

/** Open the Stripe billing portal; redirects on success. Returns an error string otherwise. */
export async function openBillingPortal(): Promise<string | null> {
  const result = await postJson("/api/billing/portal");
  if (result.url) {
    window.location.href = result.url;
    return null;
  }
  return result.errorMessage ?? "Could not open billing portal.";
}

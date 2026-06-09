import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key);
  }
  return cached;
}

/** Maps an internal plan_key to its Stripe Price id (from env). */
export function priceIdForPlan(planKey: string): string | undefined {
  return process.env[`STRIPE_PRICE_${planKey.toUpperCase()}`];
}

/** Reverse lookup: a Stripe Price id back to the internal plan_key. */
export function planForPriceId(priceId: string | null | undefined): string {
  if (!priceId) return "starter";
  for (const plan of ["starter", "growth", "studio", "business"]) {
    if (process.env[`STRIPE_PRICE_${plan.toUpperCase()}`] === priceId) return plan;
  }
  return "starter";
}

export function planDisplayName(planKey: string): string {
  return planKey.charAt(0).toUpperCase() + planKey.slice(1);
}

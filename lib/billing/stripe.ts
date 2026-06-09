import Stripe from "stripe";
import type { PlanKey } from "./plans";

// Lazy, optional Stripe wiring. Everything stays behind isStripeConfigured() so
// the app builds and runs without Stripe keys (e.g. local/preview, marketing).
//
// Required env to enable checkout + webhooks:
//   STRIPE_SECRET_KEY            sk_...
//   STRIPE_WEBHOOK_SECRET        whsec_...
//   NEXT_PUBLIC_SITE_URL         https://app.example.com  (for redirect URLs)
// Stripe Price IDs (create in the Stripe dashboard, then paste the IDs here):
//   Recurring plan prices:  STRIPE_PRICE_STARTER / _GROWTH / _STUDIO
//   One-time setup fee:     STRIPE_PRICE_SETUP_FEE
//   One-time top-up packs:  STRIPE_PRICE_TOPUP_10 / _25 / _50

let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  if (!cached) {
    // Use the SDK's pinned default API version to avoid coupling to a literal.
    cached = new Stripe(key);
  }
  return cached;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/** Recurring subscription Price ID for a plan (Business has no self-serve price). */
export function getPlanPriceId(planKey: PlanKey): string | null {
  switch (planKey) {
    case "starter":
      return process.env.STRIPE_PRICE_STARTER ?? null;
    case "growth":
      return process.env.STRIPE_PRICE_GROWTH ?? null;
    case "studio":
      return process.env.STRIPE_PRICE_STUDIO ?? null;
    default:
      return null;
  }
}

/** One-time setup-fee Price ID (added to the first subscription invoice). */
export function getSetupFeePriceId(): string | null {
  return process.env.STRIPE_PRICE_SETUP_FEE ?? null;
}

// Top-up packs: maps pack id (lib/mock-data.ts `generationTopUps`) -> Stripe
// one-time Price ID + the number of generation credits the pack grants.
export const TOPUP_PACKS: Record<string, { priceEnv: string; generations: number }> = {
  "topup-10": { priceEnv: "STRIPE_PRICE_TOPUP_10", generations: 10 },
  "topup-25": { priceEnv: "STRIPE_PRICE_TOPUP_25", generations: 25 },
  "topup-50": { priceEnv: "STRIPE_PRICE_TOPUP_50", generations: 50 }
};

export function getTopupPack(packId: string): { priceId: string | null; generations: number } | null {
  const pack = TOPUP_PACKS[packId];
  if (!pack) {
    return null;
  }
  return { priceId: process.env[pack.priceEnv] ?? null, generations: pack.generations };
}

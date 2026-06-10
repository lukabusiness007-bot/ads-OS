// Canonical, server-side plan definitions — the single source of truth for
// quota enforcement and Stripe billing. The marketing/display copy lives in
// lib/mock-data.ts (`billingTiers`); the numbers here MUST stay in sync with it.
//
// Pricing model: Proposal A ("Simple & Self-Serve"), EUR price book.
// A "generation" = creating one product's 3D/AR model. Each plan includes a
// monthly generation allowance; merchants buy top-up packs (lib/mock-data.ts
// `generationTopUps`) to go beyond it. COGS per generation is ~€0.60 (Meshy).

export type PlanKey = "starter" | "growth" | "studio" | "business";

export type PlanLimits = {
  key: PlanKey;
  name: string;
  /** Monthly recurring price in EUR (null = custom/Business quote). */
  monthlyEur: number | null;
  /** Model generations granted each billing period. null = unlimited. */
  includedGenerations: number | null;
  /** Published product (SKU) limit. null = unlimited. */
  publishedSkuLimit: number | null;
  /** Included 3D/AR views per month. null = unlimited. */
  monthlyViewLimit: number | null;
  /** Included storage in GB. null = unlimited. */
  storageGb: number | null;
  /**
   * Over monthlyViewLimit: false = viewer degrades to poster + upgrade prompt;
   * true = views keep serving and the excess is billed as Stripe metered usage
   * (requires STRIPE_PRICE_VIEW_OVERAGE — without it, every plan degrades).
   */
  meteredViewOverage: boolean;
};

// One-time onboarding/setup fee in EUR. Waived on annual billing. Mirrors
// SETUP_FEE_EUR in lib/mock-data.ts.
export const SETUP_FEE_EUR = 99;

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  starter: {
    key: "starter",
    name: "Starter",
    monthlyEur: 29,
    includedGenerations: 5,
    publishedSkuLimit: 5,
    monthlyViewLimit: 5_000,
    storageGb: 2,
    meteredViewOverage: false
  },
  growth: {
    key: "growth",
    name: "Growth",
    monthlyEur: 69,
    includedGenerations: 20,
    publishedSkuLimit: 20,
    monthlyViewLimit: 25_000,
    storageGb: 10,
    meteredViewOverage: true
  },
  studio: {
    key: "studio",
    name: "Studio",
    monthlyEur: 149,
    includedGenerations: 50,
    publishedSkuLimit: 50,
    monthlyViewLimit: 100_000,
    storageGb: 50,
    meteredViewOverage: true
  },
  business: {
    key: "business",
    name: "Business",
    monthlyEur: null,
    includedGenerations: null,
    publishedSkuLimit: null,
    monthlyViewLimit: null,
    storageGb: null,
    meteredViewOverage: false
  }
};

const VALID_PLAN_KEYS = new Set<string>(Object.keys(PLAN_LIMITS));

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && VALID_PLAN_KEYS.has(value);
}

/** Resolve a plan_key string to its limits, falling back to Starter. */
export function getPlanLimits(planKey: string | null | undefined): PlanLimits {
  if (isPlanKey(planKey)) {
    return PLAN_LIMITS[planKey];
  }
  return PLAN_LIMITS.starter;
}

/** Business / custom plans have no enforced generation ceiling. */
export function isUnlimitedGenerationPlan(planKey: string | null | undefined): boolean {
  return getPlanLimits(planKey).includedGenerations === null;
}

import type { ModelPackageCheck } from "@/lib/types";

export type ArGateResult =
  | { status: "blocked"; failing: ModelPackageCheck[] }
  | { status: "needs_reason"; warnings: ModelPackageCheck[] }
  | { status: "clear" };

/**
 * Derives the AR-ready approval gate from the existing model package checks.
 * Any failing check hard-blocks approval; warnings require a typed override
 * reason; a clean run needs no extra confirmation. Pure — callers still route
 * every status transition through decideReview.
 */
export function evaluateArGate(checks: ModelPackageCheck[]): ArGateResult {
  const failing = checks.filter((check) => check.status === "fail");
  if (failing.length > 0) return { status: "blocked", failing };

  const warnings = checks.filter((check) => check.status === "warning");
  if (warnings.length > 0) return { status: "needs_reason", warnings };

  return { status: "clear" };
}

import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/verify";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

type DiagnosticSeverity = "error" | "warning" | "info";

type DiagnosticIssue = {
  severity: DiagnosticSeverity;
  title: string;
  message: string;
  fix?: string;
};

type EnvCheck = {
  key: string;
  label: string;
  requiredFor: string;
  allowDummy?: boolean;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requiredEnvChecks: EnvCheck[] = [
  {
    key: "MESHY_API_KEY",
    label: "Meshy API key",
    requiredFor: "starting 3D generation jobs"
  },
  {
    key: "R2_ACCESS_KEY_ID",
    label: "Cloudflare R2 access key",
    requiredFor: "creating signed upload URLs"
  },
  {
    key: "R2_SECRET_ACCESS_KEY",
    label: "Cloudflare R2 secret key",
    requiredFor: "creating signed upload URLs"
  },
  {
    key: "R2_BUCKET_NAME",
    label: "Cloudflare R2 bucket",
    requiredFor: "storing uploaded photos and generated models"
  },
  {
    key: "R2_PUBLIC_BASE_URL",
    label: "Cloudflare R2 public base URL",
    requiredFor: "serving generated model assets"
  }
];

const supabaseEnvChecks: EnvCheck[] = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    label: "Supabase project URL",
    requiredFor: "login and persisted product data"
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    label: "Supabase anon key",
    requiredFor: "login and persisted product data"
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    label: "Supabase service role key",
    requiredFor: "organization setup repair"
  }
];

export async function GET(request: Request) {
  // Rate-limit before any work to blunt anonymous probing of this endpoint.
  const ip = clientIpFromHeaders(request.headers);
  const { allowed } = await checkRateLimit(`diagnostics:${ip}`, 20, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // Diagnostics expose which integrations are configured and the deployment
  // environment — internal state that must not reach anonymous callers. Restrict
  // to platform admins (a logged-in admin operator using ?debug still sees it).
  const verify = await verifyAdminRequest();
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error }, { status: verify.status });
  }

  const issues: DiagnosticIssue[] = [];

  for (const check of requiredEnvChecks) {
    const issue = getMissingOrPlaceholderIssue(check, "error");

    if (issue) {
      issues.push(issue);
    }
  }

  if (!process.env.R2_ENDPOINT && !process.env.R2_ACCOUNT_ID) {
    issues.push({
      severity: "error",
      title: "Cloudflare R2 endpoint is missing",
      message: "Set either R2_ACCOUNT_ID or R2_ENDPOINT. Without it, Vercel cannot sign upload URLs.",
      fix: "In Vercel, add R2_ACCOUNT_ID from Cloudflare R2 or add the full R2_ENDPOINT."
    });
  }

  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (supabaseConfigured) {
    for (const check of supabaseEnvChecks) {
      const issue = getMissingOrPlaceholderIssue(check, check.key === "SUPABASE_SERVICE_ROLE_KEY" ? "warning" : "error");

      if (issue) {
        issues.push(issue);
      }
    }
  } else {
    issues.push({
      severity: "info",
      title: "Supabase is disabled",
      message: "The app will run in demo mode because Supabase public env vars are not set.",
      fix: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel when you want login and saved products."
    });
  }

  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    issues.push({
      severity: "warning",
      title: "Site URL is using the default",
      message: "NEXT_PUBLIC_SITE_URL is not set, so metadata falls back to https://augmenta3d.com.",
      fix: "Set NEXT_PUBLIC_SITE_URL to the deployed Vercel URL or production domain."
    });
  }

  return NextResponse.json(
    {
      ok: !issues.some((issue) => issue.severity === "error"),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      deployment: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "local",
      checkedAt: new Date().toISOString(),
      issues
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

function getMissingOrPlaceholderIssue(check: EnvCheck, severity: DiagnosticSeverity): DiagnosticIssue | null {
  const value = process.env[check.key]?.trim();

  if (!value) {
    return {
      severity,
      title: `${check.label} is missing`,
      message: `${check.key} is not set. This is required for ${check.requiredFor}.`,
      fix: `Add ${check.key} in Vercel Project Settings > Environment Variables, then redeploy.`
    };
  }

  if (!check.allowDummy && isPlaceholderValue(value)) {
    return {
      severity,
      title: `${check.label} still has a placeholder value`,
      message: `${check.key} looks like an example or dummy value, so the deployed app cannot use it.`,
      fix: `Replace ${check.key} with the real production value in Vercel, then redeploy.`
    };
  }

  return null;
}

function isPlaceholderValue(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("your_") ||
    normalized.includes("example.com") ||
    normalized.includes("dummy") ||
    normalized.includes("placeholder")
  );
}

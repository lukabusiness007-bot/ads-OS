import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Jobs that never reach a terminal state (provider dropped the task, the status
// poller stopped running, etc.) would otherwise leave products stuck in
// "generating" forever. Anything still queued/running past this age is failed.
const STALE_JOB_THRESHOLD_MINUTES = 30;

type StaleJob = {
  id: string;
  organization_id: string;
  product_id: string;
};

export async function GET(request: Request) {
  const authError = authorizeCleanupRequest(request);
  if (authError) {
    return authError;
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json(
      { errorMessage: "Cleanup requires the Supabase service role key." },
      { status: 500 }
    );
  }

  const supabase = createServiceRoleSupabaseClient();
  const cutoff = new Date(Date.now() - STALE_JOB_THRESHOLD_MINUTES * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: staleJobs, error: selectError } = await supabase
    .from("generation_jobs")
    .select("id, organization_id, product_id")
    .in("status", ["queued", "running"])
    .lt("started_at", cutoff);

  if (selectError) {
    console.error("Stale generation cleanup query failed", { message: selectError.message });
    return NextResponse.json({ errorMessage: "Could not query stale generations." }, { status: 500 });
  }

  const jobs = (staleJobs ?? []) as StaleJob[];

  if (jobs.length === 0) {
    return NextResponse.json({ cleaned: 0, jobIds: [] });
  }

  const jobIds = jobs.map((job) => job.id);
  const productIds = [...new Set(jobs.map((job) => job.product_id))];
  const failureMessage = `Generation timed out after ${STALE_JOB_THRESHOLD_MINUTES} minutes without finishing.`;

  await supabase
    .from("generation_jobs")
    .update({
      status: "failed",
      error_message: failureMessage,
      updated_at: now
    })
    .in("id", jobIds);

  // Only fail products that are still mid-generation — never override a product
  // that already reached a later state through a different path.
  await supabase
    .from("products")
    .update({ status: "generation_failed", updated_at: now })
    .in("id", productIds)
    .eq("status", "generating");

  await supabase.from("job_events").insert(
    jobs.map((job) => ({
      organization_id: job.organization_id,
      job_id: job.id,
      event_type: "generation_timed_out",
      message: failureMessage,
      payload: { thresholdMinutes: STALE_JOB_THRESHOLD_MINUTES }
    }))
  );

  console.info("Stale generation cleanup completed", { cleaned: jobIds.length });

  return NextResponse.json({ cleaned: jobIds.length, jobIds });
}

function authorizeCleanupRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { errorMessage: "Cleanup is not configured. Set CRON_SECRET to enable it." },
      { status: 500 }
    );
  }

  const header = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;

  if (header !== expected) {
    return NextResponse.json({ errorMessage: "Unauthorized." }, { status: 401 });
  }

  return null;
}

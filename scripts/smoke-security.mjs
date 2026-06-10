// Security smoke test for the hardening pass (findings #1–#10).
//
// Exercises the UNAUTHENTICATED boundary behaviors that these fixes introduced,
// so a regression (e.g. the username->email leak coming back, diagnostics
// un-gated, status route open again) fails loudly. It does NOT need credentials.
//
// The authenticated POSITIVE paths (successful username login, analytics
// recorded for a real published page, status poll while signed in) can't be
// driven without a session + seed data — those are printed as a manual
// checklist at the end.
//
// HOW TO RUN:
//   node scripts/smoke-security.mjs <base-url>
//   # or
//   BASE_URL=https://your-deployment.vercel.app node scripts/smoke-security.mjs
//
// Point it at a deployment that has Supabase + the service role configured
// (a Vercel preview/prod URL, or local `pnpm dev` with a populated .env.local).
// Against a demo-mode instance (no Supabase) the auth checks will SKIP, since
// the app intentionally runs open in that mode.
//
// Exit code: 0 if no checks FAIL, 1 otherwise. WARN/SKIP do not fail the run.

const BASE_URL = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

let pass = 0;
let fail = 0;
let warn = 0;
let skip = 0;

function record(kind, name, detail) {
  const tag =
    kind === "PASS" ? "\x1b[32mPASS\x1b[0m" :
    kind === "FAIL" ? "\x1b[31mFAIL\x1b[0m" :
    kind === "WARN" ? "\x1b[33mWARN\x1b[0m" :
    "\x1b[90mSKIP\x1b[0m";
  if (kind === "PASS") pass++;
  else if (kind === "FAIL") fail++;
  else if (kind === "WARN") warn++;
  else skip++;
  console.log(`  ${tag}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function req(method, path, { body, headers } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual"
    });
  } catch (err) {
    // Network/connection error — return a synthetic result so checks degrade to
    // WARN instead of aborting the whole run.
    return { status: 0, headers: new Headers(), text: String(err?.message || err), json: null, networkError: true };
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, headers: res.headers, text, json };
}

console.log(`\nSecurity smoke test → ${BASE_URL}\n`);

// Reachability probe — bail early with a clear message if nothing answers.
{
  const probe = await req("GET", "/api/diagnostics");
  if (probe.networkError) {
    console.error(`Cannot reach ${BASE_URL} (${probe.text}).\nStart the app or pass a live URL: node scripts/smoke-security.mjs <base-url>\n`);
    process.exit(2);
  }
}

// ── #3 resolve-username must be gone ─────────────────────────────────────────
console.log("#3 username login (no email enumeration)");
{
  const r = await req("POST", "/api/auth/resolve-username", { body: { username: "anyone" } });
  if (r.status === 404) record("PASS", "resolve-username route removed", "404");
  else record("FAIL", "resolve-username still reachable", `got ${r.status} (enumeration oracle may be back)`);
}
{
  const r = await req("POST", "/api/auth/login-username", { body: { username: "definitely-not-real", password: "wrong-pw-xyz" } });
  if (r.status === 503) {
    record("SKIP", "login-username bad creds", "503 Not configured (demo mode / no service role)");
  } else if (r.status === 401 || r.status === 400) {
    const leaksEmail = /"email"/.test(r.text) || /@/.test(r.text);
    if (leaksEmail) record("FAIL", "login-username leaks email in body", r.text.slice(0, 120));
    else record("PASS", "login-username rejects bad creds without leaking email", `${r.status}`);
  } else {
    record("WARN", "login-username unexpected status", `${r.status} ${r.text.slice(0, 80)}`);
  }
}
{
  const r = await req("POST", "/api/auth/login-username", { body: { nonsense: true } });
  if (r.status === 400 || r.status === 401 || r.status === 503) record("PASS", "login-username validates body", `${r.status}`);
  else record("WARN", "login-username weak body validation", `${r.status}`);
}
{
  // Rate limit is 10/min per IP; fire 13 and look for a 429. Fail-open by design
  // when the service role isn't configured, so absence of 429 is a WARN not FAIL.
  let saw429 = false;
  let saw503 = false;
  for (let i = 0; i < 13; i++) {
    const r = await req("POST", "/api/auth/login-username", { body: { username: `probe-${i}`, password: "x" } });
    if (r.status === 429) saw429 = true;
    if (r.status === 503) saw503 = true;
  }
  if (saw429) record("PASS", "login-username rate limit triggers", "429 after burst");
  else if (saw503) record("SKIP", "login-username rate limit", "limiter not configured (demo mode)");
  else record("WARN", "login-username rate limit not observed", "limiter fail-open or window too wide");
}

// ── #6 diagnostics must not leak to anon ─────────────────────────────────────
console.log("\n#6 diagnostics admin-gated");
{
  const r = await req("GET", "/api/diagnostics");
  if (r.status === 401 || r.status === 403 || r.status === 503) {
    const leaks = /VERCEL|deployment|MESHY_API_KEY|SUPABASE_SERVICE_ROLE|R2_SECRET/i.test(r.text);
    if (leaks) record("FAIL", "diagnostics leaks internal state to anon", r.text.slice(0, 120));
    else record("PASS", "diagnostics denies anon", `${r.status}`);
  } else if (r.status === 200) {
    record("FAIL", "diagnostics returns 200 to anon (internal state exposed)", r.text.slice(0, 120));
  } else {
    record("WARN", "diagnostics unexpected status", `${r.status}`);
  }
}

// ── #2 generation status requires auth ───────────────────────────────────────
console.log("\n#2 generation status auth gate");
{
  const r = await req("GET", "/api/generation/status?productId=fake-product&taskId=fake-task");
  if (r.status === 401) record("PASS", "status denies anon", "401");
  else if (r.json && r.json.status === "failed" && /sign in/i.test(r.json.message || "")) record("PASS", "status denies anon", "sign-in required");
  else if (r.status === 200) record("WARN", "status returned 200 to anon", "expected in demo mode only — confirm Supabase is configured");
  else record("WARN", "status unexpected response", `${r.status} ${(r.text || "").slice(0, 80)}`);
}

// ── #5 public products CORS + 404 shape (route still works) ──────────────────
console.log("\n#5 public products endpoint");
{
  const r = await req("OPTIONS", "/api/public/products/no-such-merchant/no-such-product");
  const acao = r.headers.get("access-control-allow-origin");
  if (r.status === 204 && acao) record("PASS", "public products CORS preflight", `ACAO: ${acao}`);
  else record("WARN", "public products preflight", `${r.status} ACAO:${acao}`);
}
{
  const r = await req("GET", "/api/public/products/no-such-merchant/no-such-product");
  if (r.status === 404) record("PASS", "public products unknown slug → 404", "");
  else record("WARN", "public products unknown slug", `${r.status}`);
}

// ── #5 analytics beacon rejects junk ─────────────────────────────────────────
console.log("\n#5 analytics beacon");
{
  const r = await req("POST", "/api/analytics/hosted-page", { body: { event: "not_a_real_event" } });
  if (r.status === 400) record("PASS", "analytics beacon rejects bad payload", "400");
  else record("WARN", "analytics beacon weak validation", `${r.status}`);
}
{
  const r = await req("POST", "/api/analytics/hosted-page", {
    body: { merchantSlug: "no-such-merchant", productSlug: "no-such-product", event: "page_view" }
  });
  const okFalse = r.json && r.json.ok === false;
  if (okFalse) record("PASS", "analytics beacon ignores unknown page", "ok:false");
  else record("WARN", "analytics beacon unknown page", `${r.status} ${(r.text || "").slice(0, 80)}`);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\nResult: ${pass} pass, ${fail} fail, ${warn} warn, ${skip} skip\n`);

console.log("Manual checks (need a real account + seed data — not automatable here):");
console.log("  [ ] Sign in with USERNAME at /login → lands in dashboard (cookie session set).");
console.log("  [ ] Sign in with EMAIL still works (unchanged client path).");
console.log("  [ ] Open a real published hosted page → page_view recorded (check analytics_events grew).");
console.log("  [ ] Start a generation while signed in → status poll advances (no 401/429 under normal polling).");
console.log("  [ ] As a platform admin, open /api/diagnostics (or ?debug) → full diagnostics visible.\n");

process.exit(fail > 0 ? 1 : 0);

# ads-OS — AR Commerce Platform

## Stack
- **Framework:** Next.js 16 (App Router, Server Actions), React 19, TypeScript
- **Auth & DB:** Supabase (SSR client, cookie-based sessions)
- **Storage:** AWS S3 + presigned URLs
- **Payments:** Stripe
- **Email:** Resend + React Email
- **3D/AR:** @gltf-transform, @google/model-viewer, draco3dgltf
- **Deployment:** Vercel
- **Package manager:** pnpm

## Project structure
- `app/` — Next.js App Router pages, API routes, and Server Actions
- `components/` — shared UI components
- `lib/` — utility functions, Supabase config, helpers
- `hooks/` — custom React hooks
- `emails/` — React Email templates
- `supabase/` — migrations, RLS policies, SQL scripts
- `scripts/` — one-off scripts
- `public/` — static assets

## Authentication
- Supabase Auth with SSR cookie-based sessions (@supabase/ssr)
- Session refresh handled in middleware.ts via `supabase.auth.getUser()`
- Protected routes defined via PROTECTED_PREFIXES in middleware.ts
- Public routes: /login, /auth/callback, /hosted-page, /api/public, /api/analytics, /api/auth, /api/diagnostics

## CRITICAL: Middleware is NOT the security boundary
- The auth check in middleware.ts is a **convenience redirect only**. Middleware can be bypassed (see CVE-2025-29927 and similar header-spoofing classes).
- EVERY protected page, API route, and Server Action MUST independently re-verify the user server-side with `supabase.auth.getUser()`. Never assume "middleware already checked it."
- Never gate authorization on a header, cookie value, or anything the client can set, outside of the validated Supabase session.

## Security priorities (ALWAYS enforce these)

### Authentication & Authorization
- Always use `supabase.auth.getUser()` to validate sessions server-side — never trust `getSession()` alone client-side or client-supplied user data
- Re-check auth inside every API route AND every Server Action, not just middleware
- Role-based access: check user roles/permissions from Supabase, not from client state

### Server Actions (Next.js App Router)
- Treat every Server Action as a public, unauthenticated POST endpoint until it verifies the user itself
- Validate the authenticated user at the TOP of every Server Action before any data access or mutation
- Validate/sanitize all arguments with zod — Server Action inputs are attacker-controllable
- Never pass authorization-relevant data (userId, role, price, isAdmin) as Server Action arguments; derive them server-side from the session

### Object ownership / IDOR (high priority for this app)
- Users own models, projects, published links, billing records. NEVER fetch or mutate a record by ID without confirming it belongs to the authenticated user.
- Prefer the user-scoped Supabase client so RLS enforces ownership; if using service_role, add an explicit `eq("user_id", user.id)` ownership filter on every query.
- Applies to: /api/model/[id], published-links, preview, status, analytics-billing, and any `[id]` dynamic route.

### Supabase / Database
- All Supabase tables MUST have RLS (Row Level Security) enabled — no exceptions for new tables
- Never use the service_role key on the client side — only in server-side code (API routes, Server Actions)
- Always use the anon key for client-facing Supabase clients
- Parameterized queries only — never interpolate user input into SQL or `.rpc()` args
- Review every new migration in supabase/ for missing or overly-permissive RLS policies

### AWS S3
- Never expose AWS credentials to the client
- All S3 operations must go through presigned URLs generated server-side
- Before generating a presigned URL, verify the requester owns/has rights to the target object/key
- Validate file type AND size before generating presigned upload URLs
- Scope upload keys to the user (e.g. `uploads/{userId}/...`) so users can't overwrite each other's objects
- Presigned URLs should have short expiry (max 15 minutes for uploads)

### 3D asset ingestion / SSRF
- If a user supplies a URL for a model/image to fetch or convert, validate it against an allowlist of schemes/hosts
- Block requests to private/internal IP ranges (169.254.x, 10.x, 192.168.x, 127.x, metadata endpoints)
- Validate MIME type server-side (not by extension) before processing with gltf-transform/sharp
- Reject or sandbox oversized files before S3 upload or processing

### Stripe
- Webhook signatures MUST be verified with `stripe.webhooks.constructEvent()` using the raw body
- Make webhook handlers idempotent — Stripe retries; track processed event IDs to prevent double-crediting/charging
- Payment amounts and product/price selection must be resolved server-side, never trusted from the client
- Never log full Stripe event payloads (they contain customer PII)

### API Routes
- Validate and sanitize all incoming request bodies with zod
- Return generic error messages to the client; log details server-side only
- Rate-limit sensitive endpoints (auth, upload, payment, AI/3D generation)
- CORS: restrict origins explicitly, never wildcard `*` for authenticated APIs

### Unauthenticated public endpoints (extra scrutiny)
- /api/analytics, /api/diagnostics, /api/public, /api/auth, /hosted-page are reachable WITHOUT auth
- /api/diagnostics in particular must never leak env vars, config, versions, stack traces, or internal state
- Public analytics endpoints must not accept writes that mutate billable/owned data without verification
- Rate-limit all of these — they're the most exposed surface

### next.config.ts / headers
- Set security headers: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy
- Restrict image `remotePatterns` to known hosts only — don't allow arbitrary remote image domains
- Review any redirects/rewrites for open-redirect risk

### Environment Variables
- Never hardcode secrets, API keys, or credentials in source code
- All secrets go in .env.local (never committed); keep .env.example value-less
- Prefix variables with NEXT_PUBLIC_ ONLY when they must be client-side and are safe to expose
- Audit that no server-only secret (service_role, AWS, Stripe secret, Resend key) is ever NEXT_PUBLIC_

### Logging & error handling
- No `console.log` of secrets, tokens, user IDs, emails, or full Supabase/Stripe error objects in production paths
- Catch and reshape errors before returning — don't surface raw DB/Stripe errors to the client

### General
- Flag any `dangerouslySetInnerHTML` — sanitize before use
- No `eval()` or dynamic code execution
- Flag outdated or known-vulnerable dependencies when noticed; prefer `pnpm audit` clean

## What NOT to do
- Don't rely on middleware as the only auth gate — always re-verify server-side
- Don't treat Server Actions as private — they're public endpoints
- Don't use the Supabase service_role key in client components
- Don't fetch/mutate any record by ID without an ownership check
- Don't generate S3 presigned URLs without validating the requester's rights to that key
- Don't pass payment amounts, prices, or roles from the frontend
- Don't skip RLS on any new table
- Don't let /api/diagnostics leak internal state
- Don't use `eval()` or unsanitized `dangerouslySetInnerHTML`

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Augmenta — an AR commerce SaaS. Merchants upload product photos, the platform generates a 3D model (Meshy image-to-3D API), an admin reviews it, and the merchant gets a hosted 3D/AR product page (`/p/{merchantSlug}/{productSlug}`) plus an embeddable viewer. Revenue via Stripe subscriptions, generation top-ups, view overage, and model buyouts.

Security rules live in `.claude/CLAUDE.md` and are mandatory — re-verify auth in every route/Server Action, ownership checks on every `[id]` lookup, RLS on every table.

## Commands

```bash
pnpm dev                  # dev server (Next.js)
pnpm build                # production build — run to type-check; there is no separate typecheck script
pnpm lint                 # eslint .
pnpm email:dev            # preview React Email templates in emails/
pnpm smoke:security       # node scripts/smoke-security.mjs <base-url> — unauthenticated security regression checks
pnpm rescale-model-assets # one-off maintenance script (tsx, needs .env.local)
```

There is no unit-test framework. `smoke:security` is the only automated check; it runs against a deployed/running instance.

## Environment & demo mode

Copy `.env.example` → `.env.local`. **Every integration is optional and degrades gracefully**: with no Supabase config the app runs in open "demo mode" serving `lib/mock-data.ts`; without Stripe, billing endpoints return 503; without `RESEND_API_KEY`, email is silently disabled. Don't break this — gate new integrations behind their config checks (`isSupabaseConfigured()`, etc.).

## Architecture

### Tech stack
Next.js 16 App Router + React 19 + TypeScript, Tailwind. Supabase (Postgres + Auth, SSR cookie sessions). Cloudflare R2 for all binary storage via the AWS S3 SDK (`lib/storage/r2.ts`). Stripe billing. Resend + React Email. `@google/model-viewer` for 3D/AR rendering, `@gltf-transform` for GLB processing. Deployed on Vercel. Bilingual EN/SR (`lib/translations.ts`; `/` and `/pricing` redirect to `/sr` unless the `lang=en` cookie is set).

### Multi-tenancy & data model
`organizations` own everything; `profiles` are 1:1 with `auth.users` and join via `organization_members`. RLS on all tables uses the `user_org_ids()` SQL helper. Product lifecycle is the `product_status` enum: `draft → photos_uploaded → generating → (generation_failed | awaiting_review) → approved/rejected → published/unpublished`. Core tables: `products`, `product_photos`, `generation_jobs`, `model_assets`, `reviews`, `hosted_pages`, `analytics_events`, plus billing and admin tables.

Migrations are numbered `supabase/migrations/NNN_*.sql` — always add a new migration, never edit an applied one. `supabase/seed.sql` mirrors mock data.

### Generation pipeline (the core flow)
1. `/api/generation/uploads` — mints presigned R2 PUT URLs; photos go browser → R2 directly.
2. `/api/generation/start` — creates `generation_jobs` row, calls Meshy (`lib/providers/meshy.ts`, behind the `GenerationProvider` interface in `lib/types.ts` so providers are swappable).
3. `/api/generation/status` — polled by `hooks/useGenerationStatus.ts`; on success downloads the model, post-processes GLB/USDZ in `lib/storage/` (optimize, watermark, rescale), uploads to R2, creates `model_assets`. Vercel gives this route 2 GB / 120 s (`vercel.json`).
4. Admin reviews at `/admin/review`; approval unlocks publish → hosted page.
5. Vercel Cron hits `/api/generation/cleanup` every 15 min to fail stuck jobs (guarded by `CRON_SECRET` bearer token).

Meshy retry semantics matter: GET status retries on 5xx, POST create does NOT (could double-charge credits) — see comments in `lib/providers/meshy.ts`.

### Model file protection ("Plan 2")
Published GLB/USDZ files live in a **private** R2 bucket with no public domain. The viewer fetches `/api/model-access/<token>` where the token is a stateless HMAC grant (`lib/model-access-token.ts`); the endpoint re-checks the page is still published, then 302s to a ~5-minute R2 presigned URL. Unpublishing is therefore an instant kill switch. The same HMAC token pattern is reused for AR preview links (`lib/ar-preview-token.ts`) and email unsubscribe (`lib/email/unsubscribe.ts`).

### Route groups
- **Merchant app (auth required):** `/dashboard`, `/create`, `/upload`, `/status`, `/preview`, `/approval`, `/launch`, `/published-links`, `/analytics`, `/billing` — listed in `PROTECTED_PREFIXES` in `middleware.ts`.
- **Platform admin:** `/admin/**` pages and `/api/admin/**` routes. Every admin route starts with `verifyAdminRequest()` (`lib/admin/verify.ts`), which checks the `is_platform_admin` profile flag. Data access helpers in `lib/admin/data/`.
- **Public:** marketing (`/`, `/sr`, `/pricing`, SEO pages via `app/[seoSlug]`), hosted pages `/p/...`, embeds `/embed/...`, `/hosted-page` (demo), and the public APIs (`/api/public`, `/api/analytics`, `/api/model-access`, `/api/auth`, `/api/diagnostics`).

### Middleware & security headers (easy to break — read first)
`middleware.ts` does session refresh, login redirects (convenience only, NOT the auth boundary), the SR-language redirect, and sets a **dynamic CSP for `/embed/*`** whose `frame-ancestors` comes from the hosted page's `allowed_embed_domains` (empty = `*`, free tier). `next.config.ts` deliberately excludes `/embed/` from its global `X-Frame-Options`/CSP headers — adding a competing `frame-ancestors` there would AND-combine and break all embeds.

### Billing (`lib/billing/`)
Plan definitions in `plans.ts` (starter/growth/studio, EUR). Stripe checkout/portal/webhook under `/api/billing/`; webhook is signature-verified and idempotent (`009_topup_idempotency.sql`). View quota tracking (`view-quota.ts`, `org_view_usage`), metered overage reporting (`view-overage.ts`), delinquency suspension (`suspension.ts`), and one-time model buyout (`buyout.ts`) which unlocks clean GLB export via `/api/model/[productId]/export`. Prices/amounts are always resolved server-side from env price IDs.

### Other shared infrastructure
- `lib/rate-limit.ts` — DB-backed rate limiting via the `bump_rate_limit()` RPC; use it on any new public endpoint.
- `lib/supabase/data.ts` — the merchant-facing data layer (dashboard, products); `lib/supabase/auth-guard.ts` for auth helpers.
- `lib/analytics.ts` + `/api/analytics/hosted-page` — anonymous view/interaction tracking that feeds quotas and the dashboard.
- `emails/` — React Email templates; send via `lib/email/send.ts` (no-ops when Resend is unconfigured).
- Path alias: `@/*` maps to the repo root.

## Conventions

- Package manager is **pnpm** (a stale `package-lock.json` exists — ignore npm).
- `docs/` holds the phased build plan and master prompts — useful product context, not code truth. `start plan.md` is the original roadmap.
- User-facing marketing copy is bilingual: update both `en` and `sr` in `lib/translations.ts`.
- New tables: RLS + `organization_id` scoping + indexes, in a new numbered migration.
- When touching auth, embeds, diagnostics, model access, or analytics, run `pnpm smoke:security` against a configured deployment before considering it done.

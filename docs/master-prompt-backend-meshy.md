# Master Prompt: Veridian AR Commerce — Backend + Merchant Dashboard (Meshy, Supabase + Cloudflare R2)

Copy the full prompt below into an AI app builder (Claude Code / Cursor / v0).

## Decisions baked into this prompt

- **Backend:** Supabase (Postgres + Auth + Realtime + Edge Functions + RLS).
- **File storage:** Cloudflare R2 (S3-compatible) for all photos and 3D assets — zero egress cost; Postgres stores only metadata + R2 keys. Future upgrade: larger R2 + CDN/image-resizing layer, no architecture change.
- **3D engine:** Meshy (AI image-to-3D: **multi-image-to-3D** from product angle photos, plus finished-model upload) behind the existing `GenerationProvider` interface, with Tripo as an invisible fallback.
- **Capture:** Browser-based, cross-platform — photos taken/uploaded from desktop OR directly from the phone camera in the mobile browser (works on iPhone Safari and Android Chrome). No native scanning app, no on-device SDK.
- **Auth:** Email + Google OAuth.
- **Language:** Bilingual EN + SR.

## Top 5 competitors (positioning lessons used in the UX)

1. **Threekit** — enterprise visual commerce. Lesson: stay narrow/fast/simple for SMB, not an enterprise configurator.
2. **VNTANA** — 3D optimization/governance/QA/approval. Lesson: dashboard = clear status/publish command center + human review gate.
3. **Zakeke** — no-code ecommerce customization, guided setup, photo-to-3D. Lesson: emphasize guided setup and merchant confidence; hide the tech.
4. **Levar** — AR/3D focused on conversion + analytics. Lesson: analytics must prove value on the home screen.
5. **Emersya / Sayduck** — high-fidelity web 3D/AR viewer + embeds. Lesson: hosted page + `<model-viewer>` + AR Quick Look must be flawless on mobile.
   - Baseline: **Shopify native 3D media** — win on creation, QA, hosting, analytics, simplicity.

Capture-side lesson: Meshy image-to-3D reconstructs a model from a few clean reference images, not from a long photogrammetry scan. Guide the user to provide a small set of sharp, evenly lit angle photos (front / back / left / right / top + one material/detail shot) of a single object on a clean, uncluttered background, with a clear reshoot loop on preflight failure.

## Five demanding-client questions (used only to improve UX)

1. How fast and foolproof is creating a model? → guided capture, live angle checklist, preflight, reshoot loop, take-photo-from-phone.
2. How do I know the model is ready and good enough? → realtime status, notifications, automated checks + human review gate, 3D preview before publish.
3. Are my data and files safe and mine? → org ownership, Supabase Auth + RLS, private R2 + presigned URLs, delete-my-data.
4. How predictable is cost/usage? → plan usage meter (models/pages/storage), warn before limits, no hidden provider names/prices.
5. How do I prove it works (ROI)? → Overview KPIs + per-product analytics (views, viewer interactions, AR clicks, store CTA clicks, device mix), export.

---

```text
You are a world-class full-stack SaaS + Augmented Reality engineer (15+ years) specializing in 3D commerce, AI image-to-3D pipelines, and high-trust B2B dashboards.

GOAL
Build the real backend and an authenticated merchant dashboard for "Veridian AR Commerce", an existing Next.js 16 / React 19 / TypeScript app that currently runs on mock data. Merchants turn product photos into verified hosted 3D/AR product pages. Keep the existing product concept, hosted public page concept, and the existing TypeScript domain types and `GenerationProvider` interface. Do NOT rewrite the frontend from scratch — extend it.

NON-NEGOTIABLE CONTEXT (reuse, do not recreate)
- Stack already present: Next.js 16 (App Router), React 19, TypeScript, Tailwind. Components in `components/`, domain types in `lib/types.ts`, pipeline in `lib/generation-pipeline.ts`, mock data in `lib/mock-data.ts`, shell in `components/AppShell.tsx`.
- Reuse the existing domain types verbatim where possible: Product, ProductStatus, PhotoSet, PhotoAsset, PhotoAngle, GenerationJob, ModelAsset, Review, HostedPage, HostedPageAnalytics, HostedPageAnalyticsEvent.
- Reuse the existing `GenerationProvider` interface (createJob / getJob / getResult) with `GenerationProviderName = "meshy" | "tripo"`. Add a NEW provider `meshy` that implements it. Keep `tripo` as the invisible fallback behind the same interface. The merchant-facing workflow must not change shape.
- Reuse `runPhotoPreflight`, `requiredPhotoAngles`, `photoAngleLabels`, `pipelineStages` from `lib/generation-pipeline.ts`.

BACKEND PLATFORM: SUPABASE (data/auth) + CLOUDFLARE R2 (file storage)
Use Supabase for: Postgres (data), Auth (email + Google OAuth), Realtime (job status), Edge Functions (provider webhooks/polling), Row Level Security on every table. Use Cloudflare R2 (S3-compatible) for ALL binary files: product photos and generated 3D assets (GLB/USDZ/poster). Reason: R2 has ZERO egress fees, and a GLB is downloaded on every AR-page view — this is the dominant cost. Postgres stores ONLY metadata + R2 object keys/URLs, never the files themselves.
- Provide SQL migrations (in `supabase/migrations/`) and a `supabase/seed.sql` that mirrors current mock-data so the UI keeps working during transition.
- Auth: email magic-link/password + "Sign in with Google". Create the login at `/login` reachable from the landing page header CTA "Sign in" / "Merchant login". After login redirect to `/dashboard`. Protect all `/dashboard/**` routes via Supabase session (middleware + server components). Public routes: `/` (landing) and `/p/{merchant-slug}/{product-slug}` (hosted page).
- Multi-tenant: `organizations` own everything; `profiles` (1:1 with auth.users) belong to an organization. RLS: a user can read/write only rows where `organization_id` matches their membership.
- R2 buckets/prefixes: `product-photos/{org_id}/{product_id}/...` (PRIVATE — access only via short-lived presigned GET URLs minted server-side after an RLS-authorized check) and `model-assets/{org_id}/{product_id}/...` (PUBLIC read via Cloudflare CDN custom domain, since hosted pages serve models to anonymous shoppers; keep object keys unguessable). Uploads go directly to R2 via server-minted presigned PUT URLs (S3 SDK) — files never pass through the Next.js server. Use an R2 client wrapper `lib/storage/r2.ts` (`@aws-sdk/client-s3` + `getSignedUrl`). Store the returned object key in Postgres. Add a `delete my data` path that removes both DB rows and R2 objects. Set CORS on the R2 bucket for the app origin.

DATA MODEL (Postgres tables, all with organization_id + RLS + created_at/updated_at)
organizations, profiles (user), products, photo_sets, photo_assets, generation_jobs, model_assets, reviews, hosted_pages, analytics_events, plans, subscriptions, usage_counters (models_used, pages_published, storage_mb). Map columns 1:1 to `lib/types.ts`. Store provider raw payloads in `generation_jobs.raw_provider_payload jsonb`. Index by organization_id, product_id, status.

MESHY 3D PIPELINE — implement `meshy` GenerationProvider
The merchant has TWO ways to get a 3D model; both converge on the same `generation_jobs` -> `model_assets` -> `review` -> `hosted_page` flow:
  1. Upload/take product angle photos in the web dashboard (direct-to-R2 via presigned PUT) -> backend mints short-lived presigned GET URLs and sends them to the Meshy Multi Image to 3D API -> poll/SSE/webhook the job -> download GLB (+USDZ, poster) and store in the `model-assets` R2 bucket -> run automated model checks -> human review.
  2. Direct upload of a finished GLB/USDZ -> skip generation, go straight to automated checks + review.
- Implement `lib/providers/meshy.ts` matching `GenerationProvider`:
    - createJob: POST `https://api.meshy.ai/openapi/v1/multi-image-to-3d` with header `Authorization: Bearer ${MESHY_API_KEY}`, body referencing the R2 image URLs (one per angle: front/back/left/right/top), `target_formats` requesting GLB + USDZ, and tuned options (textured, pbr where sensible). (Use `image-to-3d` single-image endpoint as a fallback when only one usable photo exists.)
    - getJob / getResult: GET `https://api.meshy.ai/openapi/v1/multi-image-to-3d/:id` (or subscribe to the `/stream` SSE endpoint). Map Meshy statuses to the internal enum: `PENDING`/`IN_PROGRESS` -> "running", `SUCCEEDED` -> "succeeded", `FAILED`/`CANCELED` -> "failed". Surface Meshy `progress` (0–100) to drive the status timeline. Persist the full Meshy payload in `raw_provider_payload`.
    - Download the resulting GLB + USDZ + thumbnail and re-host them in the `model-assets` R2 bucket; never hotlink Meshy-hosted URLs on public pages.
- Wrap all Meshy credentials in server-only env vars; NEVER expose provider names, raw errors, or API keys to merchants. Surface only friendly statuses ("Processing model", "Quality review", "Ready to publish").
- Use a Supabase Edge Function as the Meshy webhook/poll worker; update `generation_jobs.status` and broadcast via Realtime so the dashboard updates live. Implement retry + automatic, invisible Tripo fallback if Meshy fails.
- Replace `ViewerMock` with `<model-viewer>` for preview + hosted pages once real GLB/USDZ exist (lazy-loaded). iOS AR via USDZ Quick Look, Android via Scene Viewer.

SIMPLEST POSSIBLE UPLOAD UX — this is the priority
- Single primary action "Create AR product" -> a guided wizard: (1) Product details, (2) Dimensions, (3) Store URL, (4) Capture/Upload, (5) Submit.
- Capture step offers two big, plain-language tiles:
    a) "Add photos" — large drag-and-drop / multi-select for desktop AND a "Take photo" button on mobile (`<input type="file" accept="image/*" capture="environment">`) so the merchant can shoot the product directly with their phone camera in the browser (works on iPhone Safari and Android Chrome). Show a live capture-guidance card for Meshy: "A few sharp, evenly lit shots of one object on a clean background — front, back, left, right, top, plus a material/detail close-up." Show the required-angle checklist (front/back/left/right/top/material) with a live counter. Run client+server preflight (blur, duplicates, file type, count, missing angles) and show a clear RESHOOT loop when something fails.
    b) "Upload finished 3D model" — accept GLB/USDZ the merchant already has.
- After submit: a single status timeline (Photos uploaded -> Processing model -> Quality checks -> Review -> Ready), realtime, with friendly copy. Never show meshy/tripo names or raw errors.
- Resumable, multipart uploads directly to Cloudflare R2 via server-minted presigned URLs (S3 multipart) with progress bars; mobile-friendly; files never pass through the app server.

DASHBOARD LAYOUT (authenticated, extend AppShell)
- Left sidebar, fixed. TOP of sidebar: brand LOGO + organization name (and Veridian wordmark). Collapsible on mobile (no horizontal overflow).
- Sidebar nav (merchant-friendly, hide internal phases/providers):
    1. Overview  2. Products  3. Create AR Page  4. Published Links  5. Analytics  6. Settings & Billing.
- Sidebar footer: plan usage mini-meter (models left this month) + account menu (profile, language EN/SR, sign out).
- HOME = "Overview" (statistics first, per the owner's requirement): KPI cards row — Total products, Published pages, Models in processing, Page views, AR clicks, Store CTA clicks — plus a "Next actions" list (e.g. "3 products need photos", "1 model needs review") and a compact recent-products table (Product / Status / Next action / Hosted link / AR clicks / Store clicks). Status copy must be plain: Draft, Photos needed, Generating, Needs review, Approved, Published.
- Analytics page: per-product page views, viewer interactions, AR clicks, store CTA clicks, device mix, time range filter, CSV export. Wire `analytics_events` with HostedPageAnalyticsEvent types fired from the hosted public page.
- Settings & Billing: plan, usage meters (models/month, published pages, storage), upgrade, team members, data export/delete, default language.

INTERNATIONALIZATION (EN + SR)
- Extend the existing translation approach (`lib/translations.ts`) to cover the full dashboard. All UI strings bilingual English + Serbian (latinica). Language switcher in sidebar/account menu; persist choice per profile. Default by browser locale.

SECURITY & TRUST (answer the 5 demanding-client questions in the UX)
- RLS on every table; private R2 photos behind short-lived presigned GET URLs minted only after an RLS-authorized check; unguessable public model keys; server-only R2 + Meshy credentials; rate limiting on presigned-URL minting + uploads; input validation; audit fields. Show ownership clearly. Provide data export + delete. Email + in-app notification when a model is ready or needs review. Never expose provider names or raw technical errors. Plan usage meter prevents bill surprises.

HARD CONSTRAINTS
- Do NOT promise CAD precision, instant generation, fully automated publishing, or live Shopify/Woo/Magento integrations as current features.
- Do NOT expose meshy/tripo names or raw errors to merchants.
- Keep human review as a visible gate before publish.
- Do NOT introduce unnecessary dependencies; prefer existing patterns and CSS.
- Bilingual EN+SR, responsive, no horizontal overflow on mobile; tables collapse to cards.

DELIVERABLES
1. Supabase schema (SQL migrations) + RLS policies + seed mirroring current mock data.
2. Auth (email + Google) with `/login`, protected `/dashboard/**`, middleware, session helpers.
3. `lib/storage/r2.ts` (presigned PUT/GET, multipart, delete) + R2 bucket/CORS setup notes.
4. `lib/providers/meshy.ts` implementing GenerationProvider against the Meshy Multi Image to 3D API + Edge Function webhook/poll worker + invisible Tripo fallback.
5. Upload UX (add/take photos on desktop+mobile / finished-model upload) with reuse of runPhotoPreflight and the angle checklist, resumable direct-to-R2 uploads.
6. Dashboard: sidebar (logo+name top), Overview (stats home), Products, Create AR Page wizard, Published Links, Analytics, Settings & Billing.
7. `<model-viewer>` on preview + hosted pages; analytics events wired from hosted pages.
8. EN+SR i18n across dashboard.
9. README/env doc listing every required env var (Supabase URL/keys, Google OAuth, MESHY_API_KEY [+ optional MESHY_WEBHOOK_SECRET], R2 account id/access key/secret/bucket/public domain) and run/deploy steps.

ACCEPTANCE CHECKLIST
- A new user can sign up via Google or email from the landing page and reach `/dashboard`.
- Overview shows real KPIs from Postgres; numbers update when data changes.
- A merchant can create a product, add or take angle photos (including directly from a phone camera on iPhone and Android), pass/fail preflight with a reshoot loop, and watch a realtime status timeline.
- A model can also arrive via finished-model (GLB/USDZ) upload.
- Meshy generation runs through the `meshy` provider; on Meshy failure the system falls back to Tripo automatically and invisibly.
- Human review gate works; on approve, a hosted page publishes at `/p/{org}/{slug}` with a working 3D/AR viewer (iOS Quick Look via USDZ, Android Scene Viewer via GLB).
- Hosted-page interactions appear in Analytics (views, AR clicks, store clicks, devices).
- RLS verified: a user cannot read another organization's DB rows; private R2 photos are reachable only via short-lived presigned URLs, not by guessing keys.
- No provider names or raw errors leak to merchants. Dashboard is EN+SR and has no mobile horizontal overflow.
- Plan usage meter reflects models/pages/storage and warns before limits.
```

# Plan 2 — Payment & Model Protection Plan

**Premise:** the model file is a loss leader; the product is delivery. Revenue and
retention come from owning the pipe (signed URLs, view quotas, uptime of the
merchant's product page), not from trying to make the file uncopyable. A
browser-rendered model can always be captured by a determined user — the goal is
to kill casual downloading, permanent hotlinks, and bulk catalog export, and to
make any leak traceable and contractually enforceable.

## Current exposure (why this is urgent)

- `/api/public/products/[merchant]/[product]` returns raw `glbUrl`/`usdzUrl` in
  JSON with open CORS — effectively a free bulk-download endpoint.
- Model files live in a public R2 bucket with permanent immutable URLs
  (`lib/storage/r2.ts` → `publicUrlForKey`). Once leaked, a link works forever
  and can be hotlinked from anyone's site.
- `monthlyViewLimit` exists on pricing tiers (`lib/mock-data.ts`) but is
  undefined and unenforced; analytics are tracked but never gate anything.

## Part A — Delivery control (the kill switch)

- **Remove raw model URLs from the public API.** Replace `glbUrl`/`usdzUrl` with
  an opaque short-lived model access token. Posters stay public (harmless,
  needed for social/embeds).
- **Private model bucket.** Move GLB/USDZ objects to a private R2 bucket/prefix.
  New endpoint `GET /api/model-access/{token}`:
  - Validates the token, confirms the hosted page is published, checks org
    quota/billing state, rate-limits.
  - 302-redirects to a freshly minted R2 presigned GET URL (~5 min expiry).
    Quick Look accepts presigned USDZ URLs when redirected at tap-time.
- **Just-in-time loading.** `ModelViewer.tsx` fetches its signed URL at
  render/AR-tap time instead of receiving a static `src`.
- **Origin binding.** The signing endpoint checks `Origin`/`Referer` against our
  domains plus the page's `allowed_embed_domains` (shared column with Plan 1).
  Spoofable, but kills hotlinking and shared API calls.
- **Caching trade-off.** Presigned URLs forfeit the immutable CDN cache.
  Acceptable for v1; v2 option is a Cloudflare Worker validating an HMAC token in
  front of cached objects.
- **Explicitly out of scope (security theater):** GLB encryption with in-browser
  decryption, right-click blocking, devtools detection.

## Part B — Billing structure

- **One-time generation fee per model.** Covers Meshy/Tripo + GPU cost plus
  margin; tire-kicker churn is never a pure loss.
- **Recurring hosting subscription per tier:** includes N published models and M
  monthly views.
- **Enforce `monthlyViewLimit`:** count `page_view`/`embed_view` events per org
  per calendar month.
  - Over quota → viewer degrades to poster + upgrade prompt (or Stripe metered
    overage on higher tiers).
  - Implementation: quota check inside the `/api/model-access` signing path, with
    a cached per-org counter (avoid a Supabase aggregate per request).
- **Buyout tier:** sell the file, expensively ($150–300/model): watermark-free
  GLB export via an authenticated, paid, logged endpoint. Converts inevitable
  churn into revenue against the real competitor (agencies at $100–500/model).
- **Nonpayment lifecycle.** Stripe `invoice.payment_failed` webhook
  (signature-verified, idempotent) → grace period → `hosted_pages.status =
  'unpublished'` → signing endpoint stops minting → hosted page AND all embeds on
  the merchant's store go dark. Payment restores instantly.
- **Usage plumbing.** Tie `analytics_events` aggregates into `usage_events`;
  report metered usage to Stripe subscription items.

## Part C — Watermarking & traceability

- **Pipeline watermark in `lib/storage/optimize-glb.ts`** during the existing
  gltf-transform pass:
  - Metadata extras: org id, product id, license terms, issue timestamp (cheap,
    strips easily — baseline only).
  - Vertex-level fingerprint: imperceptible per-org quantization jitter that
    survives metadata stripping and re-export. This is the enforceable evidence.
- **License terms in the merchant agreement:** models are licensed for display
  through our delivery, not delivered as files; the buyout tier is the sanctioned
  exit. The watermark makes breach detectable and provable.
- **Export endpoint (buyout):** mints the clean file from `model-source.glb`,
  records the transaction, requires auth + ownership + payment confirmation.

## Implementation order

| Step | Deliverable | Why first |
| --- | --- | --- |
| 1 | Private bucket + token + signing endpoint | Kill switch everything else depends on |
| 2 | Public API stops returning raw URLs | Closes the bulk-export hole |
| 3 | View-limit enforcement in signing path | Quotas become real |
| 4 | Stripe: generation fee + metered subscription + failed-payment unpublish | Revenue + retention lever |
| 5 | GLB watermarking in optimize pipeline | Traceability for new models |
| 6 | Paid buyout export endpoint | Churn monetization |

## Interaction with Plan 1

Ship steps 1–3 here before (or with) the public embed launch, so embeds use
tokenized loading from day one and no external integration ever depends on
permanent raw URLs.

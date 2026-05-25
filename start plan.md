# AR E-Commerce 3D Model Platform Plan

## Summary

Build an **e-commerce-first 3D/AR SaaS platform** where merchants upload product photos, generate a 3D model through our web app, wait for manual approval, then receive a polished **hosted 3D product page link** they can place on their website. The MVP will **not include Shopify, WooCommerce, Magento, SDK, or construction workflows**. Those come after the hosted-link product proves demand and revenue.

Locked decisions:
- MVP market: e-commerce first, especially furniture/home goods.
- MVP output: hosted public product page link on our platform.
- MVP input: web upload wizard with guided photo upload.
- 3D generation: API providers first, primarily Meshy/Tripo-style image-to-3D APIs.
- Publishing: manual approval required before public hosted link goes live.
- Quality promise: "Verified AR preview," not exact CAD/manufacturing precision.
- Revenue v1: charge per approved model + monthly hosted-page subscription.
- Construction: excluded from MVP.

## Phased Build Plan

### Phase 0: Product And Technical Validation

Status: complete as of 2026-05-25. See `docs/phase-0-validation.md`.

Goal: prove that one merchant can upload photos, receive a generated model, and view it in 3D/AR from a hosted page.

Sub-phases:
1. Define MVP object category: furniture and home decor products only.
2. Define supported product types for v1: chairs, tables, sofas, lamps, shelves, small decor.
3. Exclude for v1: buildings, rooms, kitchens with many modules, reflective glass, transparent objects, complex fabric physics, animated products.
4. Validate AI providers:
   - Primary: Meshy image-to-3D API.
   - Secondary fallback: Tripo image-to-model API.
   - Store provider behind an internal `GenerationProvider` interface so the app can switch later.
5. Validate output stack:
   - GLB as primary web model format.
   - USDZ generated or stored for iOS AR where needed.
   - `<model-viewer>` for public hosted pages.
   - Google Scene Viewer / WebXR / iOS Quick Look for AR launch.
6. Define model performance limits:
   - Target model size: under 10 MB.
   - Ideal triangle range: 30k-50k where possible.
   - Texture max: 2048x2048.
   - Scale convention: 1 unit = 1 meter.

### Phase 1: MVP Web App

Status: complete as of 2026-05-25. See `docs/phase-1-mvp-web-app.md`.

Goal: create the merchant-facing app where users can upload photos and manage generated product models.

Core screens:
1. Auth and organization setup.
2. Product dashboard.
3. Create product flow.
4. Guided photo upload wizard.
5. Generation status screen.
6. Model preview screen.
7. Approval status screen.
8. Hosted page settings.
9. Billing/subscription placeholder or simple paid plan setup.
10. Internal admin review dashboard.

Core entities:
- `Organization`
- `User`
- `Product`
- `PhotoSet`
- `GenerationJob`
- `ModelAsset`
- `Review`
- `HostedPage`
- `Subscription`

Required product fields:
- Product name
- Product category
- Dimensions: width, height, depth
- Customer website/product URL
- Price optional
- Description optional
- Brand/store name
- Photos
- Generated model status
- Public page status

Photo upload wizard:
1. Require 8-20 photos per product.
2. Ask for front, back, left, right, top/angle, detail/material shots.
3. Reject tiny, blurry, duplicate, or unsupported files.
4. Show upload checklist before generation.
5. Allow regeneration if result is poor.

### Phase 2: 3D Generation Pipeline

Status: prototype complete as of 2026-05-25. See `docs/phase-2-generation-pipeline.md`.

Goal: convert uploaded product photos into usable draft 3D models.

Pipeline:
1. User uploads photos.
2. App creates `PhotoSet`.
3. System runs preflight checks:
   - minimum photo count
   - image size
   - file type
   - duplicate detection
   - missing required angles warning
4. User starts generation.
5. Backend creates `GenerationJob`.
6. Queue sends job to primary AI provider.
7. Provider returns model file.
8. App stores raw output.
9. System creates optimized model package:
   - GLB
   - USDZ where available
   - preview thumbnail
   - poster image
   - metadata
10. System runs automated checks:
   - model loads
   - file size under limit
   - basic dimensions present
   - texture files valid
   - public preview can render
11. Model goes to manual review.
12. Admin approves, rejects, or requests regeneration.
13. Approved model unlocks hosted page link.

Manual review checklist:
- Model resembles product.
- Orientation is correct.
- Scale is reasonable.
- Texture/material quality is acceptable.
- No broken geometry.
- Public page preview loads.
- AR launch works on at least one supported mobile flow.
- Product is not misleading for customers.

### Phase 3: Hosted Product Page

Status: prototype complete as of 2026-05-25. See `docs/phase-3-hosted-product-page.md`.

Goal: every approved product gets a public page merchants can link from their own site.

Hosted page requirements:
1. Public URL format: `/p/{merchant-slug}/{product-slug}`.
2. Large 3D viewer above the fold.
3. AR button for supported devices.
4. Product title, description, dimensions, and merchant branding.
5. CTA button: "View on store" or "Buy on merchant site."
6. Merchant logo/name.
7. Basic trust copy: "3D preview generated and verified."
8. Mobile-first layout.
9. Fast-loading poster image before model loads.
10. Fallback message if AR is unsupported.

Do not build Shopify/WooCommerce integration yet. Merchants manually copy the hosted page link and add it to their product page, menu, button, blog post, ad, or QR code.

Analytics v1:
- Page views
- 3D viewer interactions
- AR button clicks
- CTA clicks to merchant site
- Device/browser type
- Product-level engagement

### Phase 4: MVP Commercial Launch

Status: prototype complete as of 2026-05-25. See `docs/phase-4-mvp-commercial-launch.md`.

Goal: sell the simplest valuable version before building integrations.

Pricing v1:
- Model generation/review fee per approved model.
- Monthly hosting subscription for active public pages.
- Optional regeneration fee if user wants multiple versions.

Suggested early pricing:
- Starter model: 30-50 EUR/model
- Standard verified model: 70-120 EUR/model
- Monthly hosted pages: 49-99 EUR/month for early customers
- Free trial: first 1-3 models discounted only if customer agrees to public case study

Pilot target:
- 5 merchants
- 10-30 products each
- Furniture/home decor only
- Goal: prove willingness to pay before integrations

Success metrics:
- Time from upload to draft model
- Approval pass rate
- Cost per generated usable model
- Hosted page load speed
- AR click rate
- CTA click rate back to merchant site
- Merchant renewal after first month

### Phase 5: Post-MVP Expansion

Status: prototype complete as of 2026-05-25. See `docs/phase-5-post-mvp-expansion.md`.

Only start after 5-10 paying merchants use hosted pages.

Next features in order:
1. Simple embed snippet or iframe.
2. Shopify app.
3. WooCommerce plugin.
4. Product variant/material configurator.
5. Merchant analytics dashboard v2.
6. Bulk product import.
7. White-label pages.
8. API access.
9. Native SDK.
10. Construction/project showcase product.

Construction comes later as a separate vertical, not as a hidden MVP requirement. First construction version should start with uploaded existing 3D files/CAD exports, not photo-to-building generation.

## Key Interfaces And Architecture

Recommended stack:
- Frontend: Next.js, React, TypeScript.
- Backend: Node.js with Fastify or NestJS.
- Database: PostgreSQL.
- Queue: Redis + BullMQ.
- Storage: Cloudflare R2 or AWS S3.
- CDN: Cloudflare.
- 3D viewer: `<model-viewer>`.
- 3D generation: Meshy primary, Tripo fallback.
- Payments: Stripe for international/EU readiness; manual invoices acceptable during first pilots.

Minimum API surface:
- `POST /products`
- `POST /products/:id/photos`
- `POST /products/:id/generation-jobs`
- `GET /generation-jobs/:id`
- `POST /admin/reviews/:id/approve`
- `POST /admin/reviews/:id/reject`
- `GET /p/:merchantSlug/:productSlug`
- `GET /products/:id/analytics`

Statuses:
- `draft`
- `photos_uploaded`
- `generating`
- `generation_failed`
- `awaiting_review`
- `approved`
- `rejected`
- `published`
- `unpublished`

## Test Plan

Core scenarios:
- User creates account and organization.
- User creates product and uploads valid photo set.
- System blocks invalid file types and poor photo sets.
- Generation job succeeds through primary provider.
- Generation job fails and exposes retry.
- Provider fallback can be triggered.
- Admin approves model.
- Admin rejects model with reason.
- Approved product creates public hosted page.
- Unapproved product cannot be viewed publicly.
- Hosted page loads on desktop, iOS Safari, and Android Chrome.
- AR button appears only when supported.
- CTA click to merchant site is tracked.
- Analytics dashboard shows page views, AR clicks, and CTA clicks.

Quality/performance tests:
- GLB under target size.
- Public page loads poster quickly.
- Model viewer does not break mobile layout.
- Failed model asset does not publish.
- Public page handles missing USDZ gracefully.
- Duplicate slug handling works.
- Private merchant data is not exposed on public page.

## Assumptions And Sources

Assumptions:
- Workspace currently contains planning documents only, no existing app codebase.
- MVP will be built from scratch.
- Primary language can be English first, with Serbian/Balkan localization later.
- Currency for business planning is EUR.
- "Verified AR preview" means strong visual sales quality, not exact engineering/CAD accuracy.
- Manual approval is required before any public customer-facing page goes live.
- Construction is excluded from MVP.

Technical references used:
- Apple RealityKit PhotogrammetrySession for photo-based 3D creation: https://developer.apple.com/documentation/RealityKit/PhotogrammetrySession
- Google Scene Viewer for Android AR display: https://developers.google.com/ar/develop/scene-viewer
- `<model-viewer>` web 3D/AR component: https://modelviewer.dev/docs/
- Meshy Image to 3D API: https://docs.meshy.ai/api/image-to-3d
- Tripo image-to-model API: https://docs.tripo3d.ai/model-generation/image-to-model-v1-4-20240625.html

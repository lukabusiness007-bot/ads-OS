# Master Prompt: Veridian AR Commerce Landing Page and Dashboard Redesign

Copy the full prompt below into an AI app builder.

---

You are a senior SaaS product designer, conversion copywriter, and frontend engineer specializing in augmented reality ecommerce, 3D product visualization, and high-ticket B2B SaaS.

Redesign the Veridian AR Commerce landing page and merchant dashboard so the product feels simple, trustworthy, and commercially useful for SMB furniture and home decor merchants.

## Product Context

Veridian AR Commerce helps furniture and home decor merchants turn product photos into verified hosted 3D/AR product pages.

The merchant workflow is:

1. Add a product.
2. Upload guided product photos.
3. Veridian generates and quality-checks the 3D/AR model.
4. A human reviewer approves the model before publishing.
5. The merchant receives a hosted public product page link.
6. The merchant adds that link to their ecommerce store, product page, QR code, email, or ad.
7. The dashboard tracks product-page engagement, AR clicks, and clicks back to the merchant store.

The core message is:

> Verified AR product pages for furniture stores, without hiring a 3D team.

Target buyer:

- SMB furniture and home decor merchants.
- Typical pilot: 10 to 25 products.
- They care less about AR as a novelty and more about shopper confidence, fewer purchase doubts, clearer size/scale understanding, and proving whether interactive product pages help sales.

Primary CTA:

- Book pilot demo

Secondary CTA:

- See sample product page

## Competitor Lessons

Use these competitor lessons to shape the positioning, not to create a comparison table unless it fits naturally.

- Threekit: enterprise visual commerce platform for 3D configuration, AR, hosted visualization, DAM, and integrations. Lesson: do not make Veridian feel like a complex enterprise configurator. Veridian should feel faster, narrower, and easier for SMB merchants.
- VNTANA: 3D/CAD transformation, optimization, governance, QA, approval, and distribution across channels. Lesson: the dashboard should feel like a clear product/status/publishing command center, not a technical asset-management system.
- Zakeke: no-code ecommerce customization, 3D configurators, AR, guided setup, and product-photo-to-3D support. Lesson: emphasize merchant confidence, guided setup, and ecommerce usefulness.
- Shopify native 3D product media: Shopify already supports 3D model files such as GLB/USDZ. Lesson: Veridian must win on model creation, human QA, hosting, analytics, and operational simplicity, not by pretending Shopify cannot show 3D at all.

## High-Ticket Buyer Questions

Before designing or writing copy, answer these five questions inside the page and dashboard experience:

1. Will this increase buyer confidence enough to matter?
   - Show the outcome as clearer product understanding, size/scale confidence, more product engagement, and clicks back to the merchant store.
   - Avoid unsupported claims like guaranteed conversion lift or guaranteed lower returns.

2. How hard is setup for my team?
   - Make the workflow look simple: add product, upload photos, review model, publish link, track results.
   - Emphasize guided photo upload and no internal 3D team required.

3. What happens if the model quality is bad?
   - Explain manual review, quality checks, approval before publishing, and regeneration/revision paths.
   - Do not promise CAD precision or manufacturing-grade models.

4. How predictable is pricing?
   - Position the pilot around a clear per-approved-model fee plus monthly hosted-page subscription.
   - Keep pricing easy to understand for a 10 to 25 SKU pilot.

5. How do I prove this is working?
   - Show analytics for page views, 3D viewer interactions, AR button clicks, CTA clicks to merchant store, and device mix.
   - Make proof visible on the dashboard home screen.

## Landing Page Requirements

Build a high-converting SaaS landing page. It should feel like a focused B2B product page, not a generic futuristic AR website.

Recommended public route:

- `/` for the public landing page.
- `/dashboard` for the merchant workspace.
- Keep public hosted product pages at `/p/{merchant-slug}/{product-slug}`.

First viewport:

- H1: `Verified AR product pages for furniture stores`
- Subheading: `Upload product photos, get a quality-checked 3D/AR product page, and give shoppers a clearer way to understand size, scale, and detail before they buy.`
- Primary CTA button: `Book pilot demo`
- Secondary CTA button: `See sample product page`
- Include a realistic product-page or dashboard visual, not abstract neon AR art.
- Include a short trust strip near the hero:
  - `Built for furniture and home decor`
  - `Human-reviewed models`
  - `Hosted product links`
  - `AR and store-click analytics`

Required landing page sections:

1. Hero
   - Clear offer, two CTAs, product visual, and concise trust strip.

2. Problem
   - Merchants sell products shoppers want to understand spatially.
   - Static photos do not always communicate scale, depth, and fit.
   - Hiring 3D teams or managing model files is too much overhead for SMB stores.

3. How It Works
   - Use the five-step workflow:
     - Add product
     - Upload photos
     - Review model
     - Publish link
     - Track results
   - Make it feel operational and easy.

4. What The Merchant Gets
   - Hosted public product page.
   - 3D viewer and AR launch where supported.
   - Merchant CTA back to store.
   - Quality-check badge or copy: `3D preview generated and verified`.
   - Product-level analytics.

5. Quality and Trust
   - Explain manual approval before publishing.
   - Explain that Veridian checks model resemblance, scale, orientation, file loading, and AR readiness.
   - Be clear that the promise is a verified visual AR preview, not exact CAD or manufacturing geometry.

6. Dashboard Preview
   - Show the simplified Pilot Command Center.
   - Include catalog status, next actions, published pages, AR clicks, CTA clicks, and plan usage.

7. Pilot Offer
   - Position a 10 to 25 SKU pilot for SMB furniture/home decor stores.
   - Keep the copy simple: per approved model plus monthly hosted pages.
   - Do not invent exact pricing unless existing project data is available. If pricing is shown, use ranges already provided by the project:
     - Starter model: 30 to 50 EUR per approved model.
     - Standard verified model: 70 to 120 EUR per approved model.
     - Hosted pages: 49 to 99 EUR per month.

8. FAQ
   - Answer the five high-ticket buyer questions directly.
   - Include a Shopify objection:
     - `Shopify can display 3D models if you already have the right files. Veridian helps create, check, host, publish, and measure AR product pages without asking your team to manage a 3D pipeline.`

9. Final CTA
   - Repeat the pilot-demo CTA.
   - Keep it specific: `Book a pilot demo for your first 10-25 products`.

Landing page tone:

- Clear, premium, direct, and commercially grounded.
- Use ecommerce language, not metaverse language.
- Use practical benefits: shopper confidence, product understanding, size and scale clarity, faster pilot launch, verified hosted pages, engagement analytics.

Avoid:

- Vague AR hype.
- Claims of guaranteed sales lift.
- Claims of instant perfect generation.
- Claims of CAD precision.
- Shopify app promises.
- Enterprise jargon like omnichannel visual commerce orchestration unless explaining what Veridian is not.

## Dashboard Redesign Requirements

Redesign the merchant dashboard as a `Pilot Command Center`.

The current dashboard should be simplified into four main merchant-facing navigation areas:

1. Products
2. Create AR Page
3. Published Links
4. Analytics/Billing

Hide or remove merchant-facing links to internal prototype phases such as generation provider details, expansion planning, commercial launch planning, and admin review. Admin tools may exist, but they should not appear in the merchant dashboard navigation.

Dashboard home screen must show:

- Catalog status.
- Next required actions.
- Published pages.
- AR clicks.
- CTA clicks back to merchant store.
- Current plan usage.
- A product table focused on action and performance.

Product statuses must be obvious and merchant-friendly:

- Draft
- Photos needed
- Generating
- Needs review
- Approved
- Published

Do not expose internal provider names to merchants. Use plain status copy such as `Generating model`, `Quality review`, or `Ready to publish`.

Product table columns:

- Product
- Status
- Next action
- Hosted link
- AR clicks
- Store clicks

Next action examples:

- Add photos
- Waiting for model
- Review preview
- Publish link
- Copy hosted link
- View analytics

Create AR Page flow:

- Make it a guided flow, not a technical form.
- Steps:
  - Product details
  - Dimensions
  - Store URL
  - Guided photo upload
  - Submit for generation and review
- Photo upload should explain the required images in plain merchant language:
  - Front
  - Back
  - Left side
  - Right side
  - Top or angled view
  - Material/detail shots
  - Scale/context shot if useful
- Use progress, checklists, and clear blocked/ready states.

Published Links view:

- Show each live hosted page.
- Include copy-link action.
- Include preview action.
- Include product status and verification state.
- Include CTA destination back to merchant store.

Analytics/Billing view:

- Show simple product-level analytics:
  - Page views
  - Viewer interactions
  - AR clicks
  - Store CTA clicks
  - Top devices
- Show current published-page usage and pilot plan usage.
- Keep billing simple and predictable.

## Visual Design Direction

Design style:

- Clean, premium, operational, and ecommerce-focused.
- More like a calm merchant workspace than a futuristic AR showcase.
- Use restrained colors, strong spacing, clear hierarchy, and readable tables.
- Make dashboard screens dense enough for repeated work, but not cluttered.
- Use product visuals, dashboard previews, and hosted-page previews where possible.

Do not use:

- Neon sci-fi visuals.
- Generic 3D cubes as the main brand signal.
- Bloated sidebars.
- Decorative gradients that distract from the product.
- Long explanatory text inside the app UI.

Responsive behavior:

- Landing page must work cleanly on mobile and desktop.
- Dashboard must avoid horizontal overflow on mobile.
- Tables should collapse or become card-like on small screens.
- Buttons and status labels must not wrap awkwardly or overflow.

## Implementation Expectations

If working in an existing Next.js/React/TypeScript app:

- Preserve the existing product concept and hosted public page concept.
- Prefer existing project patterns and CSS structure unless a cleaner redesign requires targeted changes.
- Create or move the public landing page to `/`.
- Create the merchant dashboard at `/dashboard`.
- Keep the public sample product page available at `/p/northline-home/arc-oak-dining-chair`.
- Simplify merchant navigation to the four main areas above.
- Do not introduce unnecessary dependencies.
- Use realistic mock data if backend persistence is not available.

## Required Copy Snippets

Use or closely adapt these lines:

- `Verified AR product pages for furniture stores`
- `Without hiring a 3D team`
- `Upload photos. We generate, check, and host the AR product page.`
- `Give shoppers a clearer sense of size, scale, and detail before they buy.`
- `Human-reviewed before publishing`
- `Hosted links you can add to your store, ads, emails, or QR codes`
- `Track page views, AR clicks, and clicks back to your store`
- `Book a pilot demo`
- `See sample product page`

## Hard Constraints

- Do not promise exact CAD accuracy.
- Do not promise instant generation.
- Do not promise fully automated publishing.
- Do not promise Shopify, WooCommerce, Magento, SDK, or iframe integrations as current features.
- Do not expose generation provider names or raw technical errors to merchants.
- Do not make the dashboard navigation reflect internal product phases.
- Do not create a generic SaaS landing page that could belong to any AI tool.

## Final Deliverables

Deliver:

1. A redesigned landing page focused on converting SMB furniture/home decor merchants to book a pilot demo.
2. A simplified merchant dashboard named `Pilot Command Center`.
3. A clear guided product creation and photo upload experience.
4. Merchant-friendly status and publishing flows.
5. Simple analytics and billing visibility.
6. Copy that answers the five high-ticket buyer questions.
7. A clean, responsive UI that feels premium, practical, and easy to trust.

## Acceptance Checklist

The work is successful only if:

- The landing page can be understood in five seconds.
- The primary CTA is obvious and repeated at sensible moments.
- The dashboard feels simpler than the current multi-route prototype.
- The merchant always knows the next action for each product.
- The value proposition is about shopper confidence and operational simplicity, not AR hype.
- Competitor lessons are reflected in the positioning.
- Unsupported claims are avoided.
- The product feels ready for a 10 to 25 SKU paid pilot.

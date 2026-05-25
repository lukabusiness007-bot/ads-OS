# Phase 3 Hosted Product Page

Status: prototype complete as of 2026-05-25.

## Implemented Scope

- Public route shape: `/p/{merchant-slug}/{product-slug}`.
- Published-page gate through hosted page status and available model asset.
- Mobile-first hosted product page with large above-the-fold 3D preview.
- Merchant branding, product title, description, dimensions, trust copy, AR action, and merchant-site CTA.
- Poster-first preview behavior represented by the hosted viewer mock until real hosted assets are connected.
- Fallback message when AR is not likely to be supported by the current device.
- Product-level analytics model for page views, viewer interactions, AR clicks, CTA clicks, and device mix.
- Client-side event tracking stub that records the latest event in local storage and logs structured payloads.

## Deferred

- Real `<model-viewer>` rendering against uploaded GLB/USDZ assets.
- Production event ingestion API and analytics dashboard persistence.
- CDN-backed poster/model delivery.
- Shopify, WooCommerce, Magento, SDK, iframe, or embed integrations.

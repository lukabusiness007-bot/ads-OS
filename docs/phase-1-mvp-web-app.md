# Phase 1 MVP Web App

Status: complete  
Date: 2026-05-25  
Implementation: Next.js 16, React 19, TypeScript

## What Was Built

Phase 1 now has a working merchant-facing prototype with local mock data and production-build verification.

Routes:

- `/` product dashboard
- `/create` auth/organization setup placeholder and create product flow
- `/upload` guided photo upload wizard
- `/status` generation status screen
- `/preview` model preview screen
- `/approval` approval status screen
- `/hosted-page` hosted page settings
- `/billing` billing/subscription placeholder
- `/admin` internal admin review dashboard
- `/p/northline-home/arc-oak-dining-chair` public hosted product page preview

Core data represented:

- `Organization`
- `Product`
- `PhotoSet` concept through upload state
- `GenerationJob`
- `ModelAsset`
- `Review`
- `HostedPage`
- `Subscription` concept through the billing placeholder

## Implementation Notes

- Product categories are limited to the Phase 0 scope: chairs, tables, sofas, lamps, shelves, and small decor.
- Generation providers are represented as mocked `meshy` and `tripo` states.
- Public hosted pages are visually present but remain part of the prototype until Phase 2 supplies real model assets and review persistence.
- The model viewer is represented by a stable visual mock. Phase 2 should replace it with `<model-viewer>` once real GLB/USDZ assets are available.
- Manual approval remains a visible gate before publishing.

## Verification

Completed checks:

- `corepack pnpm install`
- `corepack pnpm build`
- Browser smoke test on desktop routes
- Browser check for the public hosted page
- Mobile viewport check at 390x844 with no horizontal page overflow

## Phase 2 Handoff

Next implementation work should add:

- Persistent database schema for the Phase 1 entities.
- Real file upload storage.
- Preflight image checks.
- `GenerationProvider` implementation for Meshy.
- Fallback provider implementation for Tripo.
- Real GLB/USDZ asset storage.
- `<model-viewer>` integration on preview and public pages.
- Review actions backed by server mutations.


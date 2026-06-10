# Phase 2 3D Generation Pipeline

Status: prototype complete  
Date: 2026-05-25  
Implementation: local TypeScript pipeline with mocked providers

## What Was Built

Phase 2 now has a typed generation pipeline that can be wired to real providers later without changing the merchant workflow.

Core implementation:

- `PhotoSet`, `PhotoAsset`, `PreflightCheck`, provider, and model package types.
- Required photo angle definitions for front, back, left, right, top/angle, material, scale/context, and extra angles.
- Preflight checks for photo count, file type, image size, blur score, duplicates, and missing angles.
- `GenerationProvider` interface matching the Phase 0 contract.
- Mock primary and fallback providers behind the same interface.
- Model package checks for GLB presence, file size, dimensions metadata, texture limits, poster readiness, and USDZ/iOS AR readiness.
- Mock provider job metadata, raw payload storage shape, provider job IDs, and fallback availability.

Routes updated:

- `/upload` shows real preflight results from a mock photo set.
- `/status` shows the Phase 2 pipeline stages from upload through review.
- `/preview` shows automated model package checks.
- `/admin` includes package checks in the manual review flow.

## Current Scope

This phase is intentionally still local/prototype-only:

- No database persistence yet.
- No real file storage yet.
- No live third-party generation API calls yet.
- No queue worker yet.
- No real GLB/USDZ optimization worker yet.

The code now defines the interfaces and app behavior needed for those pieces, so the next backend pass can replace mock data with persistent jobs and provider calls.

## Next Backend Work

- Add persistent database schema for `PhotoSet`, `PhotoAsset`, `GenerationJob`, `ModelAsset`, and `Review`.
- Add object storage for uploaded photos and generated/raw provider assets.
- Add queue-backed generation worker.
- Implement the primary provider's API calls behind `GenerationProvider`.
- Implement the fallback provider behind `GenerationProvider`.
- Add server mutations for starting generation, polling job status, retrying fallback, and submitting review decisions.
- Replace `ViewerMock` with `<model-viewer>` once sample GLB/USDZ assets are present.

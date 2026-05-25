# Phase 0 Validation: E-Commerce 3D/AR MVP

Status: complete  
Date: 2026-05-25  
Decision owner: product/engineering

## Goal

Prove the first MVP path is technically and commercially narrow enough to build:

1. A merchant uploads furniture/home decor photos.
2. The app sends the images to an image-to-3D provider.
3. The app stores a generated model package.
4. An internal reviewer approves the model.
5. A hosted public product page displays the model in 3D and launches AR where supported.

Phase 0 does not require building the full app. It locks the scope, technical assumptions, provider abstraction, model limits, and validation checklist for Phase 1 and Phase 2.

## MVP Object Scope

### Included Categories

The MVP supports furniture and home decor products only.

Supported v1 product types:

- Chairs
- Tables
- Sofas
- Lamps
- Shelves
- Small decor

These categories are suitable because they are usually single objects, customer-visible, spatially relevant, and useful in AR before purchase.

### Excluded Categories

Excluded from v1:

- Buildings
- Rooms
- Kitchens with many modules
- Reflective glass products
- Transparent objects
- Products requiring complex fabric physics
- Animated products
- Construction workflows
- CAD/BIM upload and precision-model requirements

These exclusions protect the MVP from scope drift. The initial product promise is a verified visual AR preview, not exact manufacturing geometry.

## Provider Validation

### Primary Provider: Meshy

Decision: use Meshy as the primary image-to-3D provider for the first implementation.

Validation notes:

- Meshy exposes an Image to 3D API suitable for converting product images into model assets.
- Current public docs list export support for formats including GLB and USDZ, which matches the MVP output stack.
- API integration should be treated as asynchronous job orchestration, not a blocking request.
- Store provider-specific task IDs, status payloads, raw model URLs, and error responses for support/debugging.

Source: https://docs.meshy.ai/api/image-to-3d

### Secondary Provider: Tripo

Decision: keep Tripo as the first fallback provider behind the same internal abstraction.

Validation notes:

- Tripo exposes an image-to-model API through task creation.
- The documented flow supports uploading or referencing an image file, creating an image-to-model task, and polling/retrieving results.
- Use it as a fallback if Meshy output quality, pricing, throughput, or availability becomes a blocker.

Source: https://docs.tripo3d.ai/model-generation/image-to-model-v1-4-20240625.html

### Provider Strategy

Do not let product, job, or hosted-page code call Meshy or Tripo directly. Route generation through an internal provider interface so the app can switch providers without changing merchant workflows.

Recommended TypeScript contract:

```ts
export type GenerationProviderName = "meshy" | "tripo";

export type GenerationProviderInput = {
  productId: string;
  photoSetId: string;
  imageUrls: string[];
  productName: string;
  category: "chair" | "table" | "sofa" | "lamp" | "shelf" | "small_decor";
  dimensionsMeters?: {
    width: number;
    height: number;
    depth: number;
  };
};

export type GenerationProviderJob = {
  provider: GenerationProviderName;
  providerJobId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  rawPayload: unknown;
};

export type GenerationProviderResult = {
  provider: GenerationProviderName;
  providerJobId: string;
  glbUrl?: string;
  usdzUrl?: string;
  thumbnailUrl?: string;
  rawAssetUrls: string[];
  rawPayload: unknown;
};

export interface GenerationProvider {
  name: GenerationProviderName;
  createJob(input: GenerationProviderInput): Promise<GenerationProviderJob>;
  getJob(providerJobId: string): Promise<GenerationProviderJob>;
  getResult(providerJobId: string): Promise<GenerationProviderResult>;
}
```

Implementation notes:

- Persist `provider`, `providerJobId`, `providerStatus`, and `rawProviderPayload` on `GenerationJob`.
- Persist raw provider output before optimization.
- Add a manual admin-only fallback trigger from Meshy to Tripo.
- Do not expose provider names or raw errors on public hosted pages.

## Output Stack Validation

### Primary Web Format

Decision: GLB is the primary hosted-page model format.

Rationale:

- GLB is widely supported in web 3D pipelines.
- A single binary asset is simpler to host, cache, and deliver through a CDN than separate mesh/texture files.
- It works directly with `<model-viewer>`.

### iOS AR Format

Decision: store or generate USDZ for iOS AR where available.

Rationale:

- Apple AR Quick Look uses USDZ for object preview in supported Apple apps and browsers.
- If a provider does not return USDZ, generate it in the optimization pipeline or hide iOS AR until a valid USDZ exists.

Source: https://developer.apple.com/augmented-reality/quick-look/

### Hosted Viewer

Decision: use `<model-viewer>` for hosted product pages.

Required hosted-page viewer attributes:

```html
<model-viewer
  src="{model.glbUrl}"
  ios-src="{model.usdzUrl}"
  poster="{model.posterUrl}"
  alt="{product.name} 3D preview"
  camera-controls
  auto-rotate
  ar
  ar-modes="webxr scene-viewer quick-look"
  shadow-intensity="1"
  loading="lazy">
</model-viewer>
```

Validation notes:

- `<model-viewer>` supports WebXR, Scene Viewer, and Quick Look AR launch modes.
- Android AR should route through Google Scene Viewer where available.
- iOS AR should route through Quick Look when a valid USDZ is present.
- Hosted pages need a poster image fallback before the GLB loads.

Sources:

- https://modelviewer.dev/docs/
- https://modelviewer.dev/examples/augmentedreality/
- https://developers.google.com/ar/develop/scene-viewer

## Model Performance Limits

Locked v1 limits:

- Target GLB size: under 10 MB.
- Ideal triangle range: 30k-50k where possible.
- Maximum texture size: 2048x2048.
- Scale convention: 1 unit = 1 meter.
- Orientation convention: product front faces positive Z or the app's chosen viewer-front convention, but it must be consistent before launch.
- Origin convention: object centered on floor contact point where possible.

Failure handling:

- A model over 10 MB can enter manual review but cannot be auto-published.
- A model with broken textures, invalid scale, or failed viewer load must be rejected or sent to optimization.
- A missing USDZ should not block desktop 3D publishing, but the public page must hide or disable unsupported iOS AR.

## Minimum Validation Test

Before Phase 1 starts, run one manual product through the target flow:

1. Select one chair, table, lamp, shelf, or small decor item.
2. Capture 8-20 photos with front, back, left, right, angled/top, and material/detail shots.
3. Submit the images to Meshy manually or through a small script/spike.
4. Download or store the returned GLB and USDZ if available.
5. Load the GLB in a minimal `<model-viewer>` page.
6. Open the page on desktop Chrome/Safari.
7. Open the page on iOS Safari and confirm Quick Look if USDZ exists.
8. Open the page on Android Chrome and confirm Scene Viewer/WebXR where supported.
9. Record file size, approximate triangle count, texture dimensions, visual quality, and scale issues.
10. Decide whether the model would pass manual review for a real merchant.

Acceptance criteria:

- GLB loads in the hosted viewer.
- Poster image loads before or during model load.
- Model visually resembles the original product.
- Model scale is plausible for AR.
- Public page does not expose private merchant data.
- If AR is unsupported, the page shows a graceful fallback.

## Phase 0 Decisions

- Build the MVP for furniture and home decor only.
- Start with hosted public product pages, not embeds or e-commerce plugins.
- Use Meshy as the primary generation provider.
- Keep Tripo as the fallback provider.
- Hide all providers behind `GenerationProvider`.
- Store GLB as the primary web asset.
- Store or generate USDZ for iOS AR.
- Use `<model-viewer>` for hosted pages.
- Require manual approval before publishing.
- Use performance gates before public release.

## Phase 1 Handoff

Phase 1 should start with the web app foundation:

- Auth and organization setup.
- Product creation with supported categories only.
- Guided upload wizard enforcing 8-20 images.
- Product and generation status model.
- Internal admin review state.
- Hosted-page record, but public publishing remains locked until approved assets exist.


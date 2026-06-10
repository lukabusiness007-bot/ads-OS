export type ProductCategory =
  | "chair"
  | "table"
  | "sofa"
  | "lamp"
  | "shelf"
  | "small_decor";

export type ProductStatus =
  | "draft"
  | "photos_uploaded"
  | "generating"
  | "generation_failed"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "published"
  | "unpublished";

export type PhotoAngle =
  | "front"
  | "back"
  | "left"
  | "right"
  | "top_angle"
  | "material_detail"
  | "scale_context"
  | "extra_angle";

export type PhotoAsset = {
  id: string;
  fileName: string;
  angle: PhotoAngle;
  fileType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
  blurScore: number;
  duplicateGroup?: string;
};

export type PhotoSet = {
  id: string;
  productId: string;
  photos: PhotoAsset[];
  requiredAngles: PhotoAngle[];
};

export type PreflightCheck = {
  id: string;
  label: string;
  status: "pass" | "warning" | "fail";
  detail: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  status: ProductStatus;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  customerUrl: string;
  price?: string;
  description?: string;
  brandName: string;
  photoCount: number;
  requiredAnglesComplete: boolean;
  modelAsset?: ModelAsset;
  hostedPage?: HostedPage;
  analytics?: HostedPageAnalytics;
};

export type ModelAsset = {
  glbUrl: string;
  usdzUrl?: string;
  posterUrl: string;
  thumbnailUrl?: string;
  fileSizeMb: number;
  triangleCount: number;
  textureMax: number;
  dimensionsPresent?: boolean;
  appliedScale?: number;
  metadataUrl?: string;
};

export type GenerationClientStatus = "queued" | "running" | "succeeded" | "failed";

export type GenerationPhotoContentType = "image/jpeg" | "image/png";

export type GenerationUploadPhotoInput = {
  fileName: string;
  contentType: GenerationPhotoContentType;
  size: number;
};

export type GenerationUploadPhoto = GenerationUploadPhotoInput & {
  key: string;
};

export type CreateGenerationUploadsRequest = {
  productName: string;
  category?: ProductCategory;
  description?: string;
  customerUrl?: string;
  price?: string;
  dimensions?: Product["dimensions"];
  photos: GenerationUploadPhotoInput[];
};

export type CreateGenerationUploadsResponse = {
  productId: string;
  uploads: Array<GenerationUploadPhoto & {
    uploadUrl: string;
    headers: Record<string, string>;
  }>;
  errorMessage?: string;
  failureCode?: string;
};

export type StartGenerationRequest = {
  productId: string;
  photos: GenerationUploadPhoto[];
  imageEnhancement: boolean;
};

export type StartGenerationResponse = {
  productId?: string;
  taskId?: string;
  status?: "queued";
  errorMessage?: string;
  failureCode?: string;
};

export type GenerationStatusResponse = {
  status: GenerationClientStatus;
  progress: number;
  message: string;
  asset?: ModelAsset;
  errorMessage?: string;
  failureCode?: string;
  retryable?: boolean;
};

export type HostedPage = {
  slug: string;
  publicUrl: string;
  status: "locked" | "ready" | "published" | "unpublished";
  ctaLabel: "View on store" | "Buy on merchant site";
};

export type HostedPageAnalytics = {
  pageViews: number;
  viewerInteractions: number;
  arButtonClicks: number;
  ctaClicks: number;
  topDevices: Array<{
    type: "mobile" | "desktop" | "tablet";
    share: number;
  }>;
};

export type HostedPageAnalyticsEvent =
  | "page_view"
  | "viewer_interaction"
  | "ar_button_click"
  | "cta_click";

export type GenerationJob = {
  id: string;
  productId: string;
  provider: "meshy" | "tripo";
  status: "queued" | "running" | "succeeded" | "failed";
  startedAt: string;
  updatedAt: string;
  providerJobId?: string;
  providerStatus?: string;
  rawProviderPayload?: unknown;
  fallbackAvailable?: boolean;
  errorMessage?: string;
};

export type GenerationProviderName = GenerationJob["provider"];

export type GenerationProviderInput = {
  productId: string;
  photoSetId: string;
  imageUrls: string[];
  productName: string;
  category: ProductCategory;
  dimensionsMeters?: Product["dimensions"];
};

export type GenerationProviderJob = {
  provider: GenerationProviderName;
  providerJobId: string;
  status: GenerationJob["status"];
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

export type ModelPackageCheck = {
  id: string;
  label: string;
  status: "pass" | "warning" | "fail";
  detail: string;
};

export type Review = {
  id: string;
  productId: string;
  status: "pending" | "approved" | "rejected" | "changes_requested";
  reviewer?: string;
  notes?: string;
};

export type PricingPackage = {
  id: string;
  name: string;
  priceRangeEur: string;
  billingUnit: string;
  description: string;
  includes: string[];
};

export type MarketReference = {
  id: string;
  name: string;
  segment: string;
  pricingSignal: string;
  bestFor: string;
  lesson: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type BillingTier = {
  id: string;
  name: string;
  /** Monthly recurring price in EUR (null for custom/Business quote). */
  monthlyUsd: number | null;
  publishedSkuLimit: number | null;
  /** Model generations included each billing period (null = unlimited/custom). */
  includedGenerations?: number | null;
  /** One-time onboarding/setup fee in EUR (waived on annual billing). */
  setupFeeEur?: number | null;
  storageGb: number | null;
  monthlyViewLimit: number | null;
  positioning: string;
  includes: string[];
  recommended?: boolean;
};

export type TopUpPack = {
  id: string;
  name: string;
  /** Extra model generations granted by the pack. */
  generations: number;
  /** One-time price in EUR. */
  priceEur: number;
  /** Effective price per generation, for display. */
  perModelEur: number;
  note: string;
  recommended?: boolean;
};

export type OveragePrice = {
  id: string;
  name: string;
  priceUsd: number;
  unit: string;
  guardrail: string;
};

export type ModelCreationAddon = {
  id: string;
  name: string;
  priceUsd: string;
  buyerFit: string;
  useCase: string;
};

export type CostAssumption = {
  id: string;
  name: string;
  monthlyUsd: number | null;
  costBasis: string;
  billingImpact: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type MarginScenario = {
  id: string;
  label: string;
  tierName: string;
  skuCount: number;
  averageAssetMb: number;
  monthlyRevenueUsd: number;
  estimatedVariableCostUsd: number;
  storageUsedGb: number;
};

export type UsageScenario = {
  id: string;
  monthlyViews: number;
  recommendedTier: string;
  includedViews: number;
  overageUsd: number;
  note: string;
};

export type ModelProductionScenario = {
  id: string;
  skuCount: number;
  addonName: string;
  revenueUsd: number;
  expectedRevisions: number;
  estimatedCogsUsd: number;
};

export type SalesObjection = {
  id: string;
  objection: string;
  answer: string;
};

export type QualityCheck = {
  id: string;
  label: string;
  acceptance: string;
};

export type ClientConversationLine = {
  id: string;
  speaker: "High-ticket client" | "Premium service maker";
  line: string;
};

export type PilotMerchant = {
  id: string;
  name: string;
  category: "furniture" | "home_decor";
  targetProducts: number;
  status: "prospect" | "contacted" | "pilot_offer_sent" | "active" | "paused";
  caseStudyEligible: boolean;
};

export type LaunchMetric = {
  id: string;
  label: string;
  value: string;
  target: string;
  status: "on_track" | "watch" | "needs_data";
};

export type ExpansionFeature = {
  id: string;
  rank: number;
  name: string;
  category: "integration" | "commerce" | "analytics" | "platform" | "vertical";
  status: "next" | "planned" | "deferred";
  trigger: string;
  merchantValue: string;
  mvpScope: string[];
  blockedBy?: string[];
};

export type ExpansionReadinessSignal = {
  id: string;
  label: string;
  value: string;
  target: string;
  status: "ready" | "watch" | "blocked";
};

// ---- Admin types ----

export type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  is_platform_admin: boolean;
  suspended_at: string | null;
  default_language: string;
  created_at: string;
  updated_at: string;
};

export type AdminOrg = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  plan_key: string;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminOrgMember = {
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
  profile: Pick<AdminProfile, "id" | "full_name" | "email" | "username" | "suspended_at">;
};

export type AdminSubscription = {
  id: string;
  organization_id: string;
  plan_key: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
};

export type AdminProduct = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  category: string;
  status: ProductStatus;
  description: string | null;
  customer_url: string | null;
  price: string | null;
  width_m: number | null;
  height_m: number | null;
  depth_m: number | null;
  photo_count: number;
  required_angles_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminModelAsset = {
  id: string;
  product_id: string;
  generation_job_id: string | null;
  glb_r2_key: string | null;
  usdz_r2_key: string | null;
  poster_r2_key: string | null;
  public_glb_url: string | null;
  public_usdz_url: string | null;
  public_poster_url: string | null;
  file_size_mb: number | null;
  triangle_count: number;
  texture_max: number;
  dimensions_present: boolean;
  created_at: string;
};

export type AdminReview = {
  id: string;
  product_id: string;
  organization_id: string;
  status: "pending" | "approved" | "rejected" | "changes_requested";
  reviewer_id: string | null;
  reviewer_kind: "human" | "auto";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminGenerationJob = {
  id: string;
  product_id: string;
  provider: string;
  status: "queued" | "running" | "succeeded" | "failed";
  progress: number;
  error_message: string | null;
  started_at: string;
  updated_at: string;
};

export type AdminAuditEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Pick<AdminProfile, "id" | "full_name" | "email" | "username"> | null;
};

export type AdminNotification = {
  id: string;
  product_id: string | null;
  action: string;
  read: boolean;
  created_at: string;
  product?: Pick<AdminProduct, "id" | "name" | "status"> | null;
};

export type AdminOverviewRange = "7d" | "30d" | "90d";

export type AdminOverviewStats = {
  awaiting_review: number;
  generating: number;
  generation_failed: number;
  published: number;
  total_merchants: number;
  range: AdminOverviewRange;
  new_signups_in_range: number;
  new_signups_prev_range: number;
  needs_attention: Array<{
    id: string;
    name: string;
    status: ProductStatus;
    org_name: string;
    updated_at: string;
  }>;
};

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  suspended_at: string | null;
  created_at: string;
  org_name: string | null;
  org_id: string | null;
  plan_key: string | null;
  subscription_status: string | null;
};

export type AdminReviewQueueItem = {
  product: AdminProduct;
  org: Pick<AdminOrg, "id" | "name">;
  review: AdminReview | null;
  model_asset: AdminModelAsset | null;
  modelAssetForViewer?: { glbUrl: string; usdzUrl?: string; posterUrl: string };
  latest_job: AdminGenerationJob | null;
  photos: Array<{ id: string; r2_key: string; angle: string | null; file_name: string }>;
};

export type ReviewDecision = {
  decision: "approved" | "rejected" | "regenerate";
  notes?: string;
  /**
   * Deprecated as an input: the reviewer is derived from the authenticated admin
   * session server-side, never trusted from the client. Kept optional so existing
   * callers that still send it type-check.
   */
  reviewerId?: string;
};

export type AutoReviewVerdict = "approve" | "reject" | "needs_human";

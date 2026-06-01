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
};

export type StartGenerationRequest = {
  productId: string;
  photos: GenerationUploadPhoto[];
  imageEnhancement: boolean;
};

export type StartGenerationResponse = {
  productId: string;
  taskId: string;
  status: "queued";
};

export type GenerationStatusResponse = {
  status: GenerationClientStatus;
  progress: number;
  message: string;
  asset?: ModelAsset;
  errorMessage?: string;
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
  monthlyUsd: number | null;
  publishedSkuLimit: number | null;
  storageGb: number | null;
  monthlyViewLimit: number | null;
  positioning: string;
  includes: string[];
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

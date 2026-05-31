import { requiredPhotoAngles } from "./generation-pipeline";
import type {
  BillingTier,
  ClientConversationLine,
  CostAssumption,
  ExpansionFeature,
  ExpansionReadinessSignal,
  GenerationJob,
  LaunchMetric,
  MarginScenario,
  MarketReference,
  ModelCreationAddon,
  ModelProductionScenario,
  OveragePrice,
  PhotoSet,
  PilotMerchant,
  PricingPackage,
  Product,
  QualityCheck,
  SalesObjection,
  UsageScenario,
  Review
} from "./types";

export const organization = {
  name: "Northline Home",
  website: "https://northline.example",
  owner: "Mila Petrovic",
  plan: "Pilot hosted pages",
  planTier: "growth"
};

export const products: Product[] = [
  {
    id: "prod-chair-001",
    name: "Arc Oak Dining Chair",
    slug: "arc-oak-dining-chair",
    category: "chair",
    status: "published",
    dimensions: { width: 0.48, height: 0.82, depth: 0.52 },
    customerUrl: "https://northline.example/products/arc-oak-chair",
    price: "89 EUR",
    description: "Solid oak dining chair with curved back support.",
    brandName: "Northline Home",
    photoCount: 16,
    requiredAnglesComplete: true,
    modelAsset: {
      glbUrl: "/models/sample-product.glb",
      usdzUrl: "/models/sample-product.usdz",
      posterUrl: "/posters/sample-product.svg",
      thumbnailUrl: "/posters/sample-product.svg",
      fileSizeMb: 0.01,
      triangleCount: 72,
      textureMax: 4096,
      dimensionsPresent: true,
      metadataUrl: "/metadata/sample-product.json"
    },
    hostedPage: {
      slug: "northline-home/arc-oak-dining-chair",
      publicUrl: "/p/northline-home/arc-oak-dining-chair",
      status: "published",
      ctaLabel: "View on store"
    },
    analytics: {
      pageViews: 1248,
      viewerInteractions: 612,
      arButtonClicks: 188,
      ctaClicks: 94,
      topDevices: [
        { type: "mobile", share: 68 },
        { type: "desktop", share: 24 },
        { type: "tablet", share: 8 }
      ]
    }
  },
  {
    id: "prod-lamp-002",
    name: "Mira Table Lamp",
    slug: "mira-table-lamp",
    category: "lamp",
    status: "generating",
    dimensions: { width: 0.24, height: 0.46, depth: 0.24 },
    customerUrl: "https://northline.example/products/mira-lamp",
    price: "54 EUR",
    description: "Compact ceramic lamp with woven linen shade.",
    brandName: "Northline Home",
    photoCount: 12,
    requiredAnglesComplete: true
  },
  {
    id: "prod-shelf-003",
    name: "Vale Wall Shelf",
    slug: "vale-wall-shelf",
    category: "shelf",
    status: "photos_uploaded",
    dimensions: { width: 0.8, height: 0.22, depth: 0.18 },
    customerUrl: "https://northline.example/products/vale-wall-shelf",
    description: "Minimal wall shelf in walnut veneer.",
    brandName: "Northline Home",
    photoCount: 9,
    requiredAnglesComplete: false
  }
];

export const generationJobs: GenerationJob[] = [
  {
    id: "job-1001",
    productId: "prod-chair-001",
    provider: "meshy",
    status: "succeeded",
    startedAt: "2026-05-25T08:40:00.000Z",
    updatedAt: "2026-05-25T09:08:00.000Z",
    providerJobId: "meshy-prod-chair-001-photoset-chair-001",
    providerStatus: "completed",
    fallbackAvailable: true,
    rawProviderPayload: {
      taskId: "meshy-prod-chair-001-photoset-chair-001",
      outputFormats: ["glb", "usdz"],
      rawAssetStored: true
    }
  },
  {
    id: "job-1002",
    productId: "prod-lamp-002",
    provider: "meshy",
    status: "running",
    startedAt: "2026-05-25T09:20:00.000Z",
    updatedAt: "2026-05-25T09:34:00.000Z",
    providerJobId: "meshy-prod-lamp-002-photoset-lamp-002",
    providerStatus: "processing",
    fallbackAvailable: true,
    rawProviderPayload: {
      taskId: "meshy-prod-lamp-002-photoset-lamp-002",
      pollAfterSeconds: 45
    }
  }
];

export const photoSets: PhotoSet[] = [
  {
    id: "photoset-chair-001",
    productId: "prod-chair-001",
    requiredAngles: requiredPhotoAngles,
    photos: [
      { id: "photo-001", fileName: "chair-front.jpg", angle: "front", fileType: "image/jpeg", width: 2400, height: 1800, blurScore: 0.91 },
      { id: "photo-002", fileName: "chair-back.jpg", angle: "back", fileType: "image/jpeg", width: 2400, height: 1800, blurScore: 0.88 },
      { id: "photo-003", fileName: "chair-left.jpg", angle: "left", fileType: "image/jpeg", width: 2400, height: 1800, blurScore: 0.86 },
      { id: "photo-004", fileName: "chair-right.jpg", angle: "right", fileType: "image/jpeg", width: 2400, height: 1800, blurScore: 0.87 },
      { id: "photo-005", fileName: "chair-top.jpg", angle: "top_angle", fileType: "image/jpeg", width: 2200, height: 1800, blurScore: 0.82 },
      { id: "photo-006", fileName: "chair-seat-detail.jpg", angle: "material_detail", fileType: "image/jpeg", width: 2200, height: 1800, blurScore: 0.89 },
      { id: "photo-007", fileName: "chair-room-scale.jpg", angle: "scale_context", fileType: "image/jpeg", width: 2200, height: 1800, blurScore: 0.8 },
      { id: "photo-008", fileName: "chair-angle-1.webp", angle: "extra_angle", fileType: "image/webp", width: 2200, height: 1800, blurScore: 0.84 },
      { id: "photo-009", fileName: "chair-angle-2.webp", angle: "extra_angle", fileType: "image/webp", width: 2200, height: 1800, blurScore: 0.83 },
      { id: "photo-010", fileName: "chair-leg-detail.png", angle: "material_detail", fileType: "image/png", width: 1800, height: 1800, blurScore: 0.9 }
    ]
  },
  {
    id: "photoset-lamp-002",
    productId: "prod-lamp-002",
    requiredAngles: requiredPhotoAngles,
    photos: [
      { id: "photo-101", fileName: "lamp-front.jpg", angle: "front", fileType: "image/jpeg", width: 2100, height: 1600, blurScore: 0.87 },
      { id: "photo-102", fileName: "lamp-back.jpg", angle: "back", fileType: "image/jpeg", width: 2100, height: 1600, blurScore: 0.84 },
      { id: "photo-103", fileName: "lamp-left.jpg", angle: "left", fileType: "image/jpeg", width: 2100, height: 1600, blurScore: 0.82 },
      { id: "photo-104", fileName: "lamp-right.jpg", angle: "right", fileType: "image/jpeg", width: 2100, height: 1600, blurScore: 0.8 },
      { id: "photo-105", fileName: "lamp-top.jpg", angle: "top_angle", fileType: "image/jpeg", width: 1900, height: 1500, blurScore: 0.79 },
      { id: "photo-106", fileName: "lamp-ceramic-detail.jpg", angle: "material_detail", fileType: "image/jpeg", width: 1900, height: 1500, blurScore: 0.86 },
      { id: "photo-107", fileName: "lamp-table-scale.jpg", angle: "scale_context", fileType: "image/jpeg", width: 1900, height: 1500, blurScore: 0.78 },
      { id: "photo-108", fileName: "lamp-shade-detail.webp", angle: "material_detail", fileType: "image/webp", width: 1800, height: 1600, blurScore: 0.83 },
      { id: "photo-109", fileName: "lamp-angle-1.webp", angle: "extra_angle", fileType: "image/webp", width: 1800, height: 1600, blurScore: 0.81 },
      { id: "photo-110", fileName: "lamp-angle-2.webp", angle: "extra_angle", fileType: "image/webp", width: 1800, height: 1600, blurScore: 0.79 },
      { id: "photo-111", fileName: "lamp-base.png", angle: "material_detail", fileType: "image/png", width: 1600, height: 1600, blurScore: 0.77 },
      { id: "photo-112", fileName: "lamp-cord.jpg", angle: "extra_angle", fileType: "image/jpeg", width: 1300, height: 1300, blurScore: 0.7 }
    ]
  },
  {
    id: "photoset-shelf-003",
    productId: "prod-shelf-003",
    requiredAngles: requiredPhotoAngles,
    photos: [
      { id: "photo-201", fileName: "shelf-front.jpg", angle: "front", fileType: "image/jpeg", width: 2200, height: 1600, blurScore: 0.86 },
      { id: "photo-202", fileName: "shelf-back.jpg", angle: "back", fileType: "image/jpeg", width: 2200, height: 1600, blurScore: 0.85 },
      { id: "photo-203", fileName: "shelf-left.jpg", angle: "left", fileType: "image/jpeg", width: 2200, height: 1600, blurScore: 0.83 },
      { id: "photo-204", fileName: "shelf-right.jpg", angle: "right", fileType: "image/jpeg", width: 2200, height: 1600, blurScore: 0.82 },
      { id: "photo-205", fileName: "shelf-top.jpg", angle: "top_angle", fileType: "image/jpeg", width: 1100, height: 900, blurScore: 0.79 },
      { id: "photo-206", fileName: "shelf-finish.jpg", angle: "material_detail", fileType: "image/jpeg", width: 1800, height: 1400, blurScore: 0.61 },
      { id: "photo-207", fileName: "shelf-finish-copy.jpg", angle: "material_detail", fileType: "image/jpeg", width: 1800, height: 1400, blurScore: 0.61, duplicateGroup: "shelf-finish" },
      { id: "photo-208", fileName: "shelf-room.jpg", angle: "scale_context", fileType: "image/jpeg", width: 1800, height: 1400, blurScore: 0.76 },
      { id: "photo-209", fileName: "shelf-angle.webp", angle: "extra_angle", fileType: "image/webp", width: 1800, height: 1400, blurScore: 0.74 }
    ]
  }
];

export const reviews: Review[] = [
  {
    id: "review-501",
    productId: "prod-chair-001",
    status: "pending",
    notes: "Scale looks plausible. Check rear-leg geometry before approval."
  }
];

export const pricingPackages: PricingPackage[] = [
  {
    id: "starter-model",
    name: "Starter model",
    priceRangeEur: "30-50 EUR",
    billingUnit: "per approved model",
    description: "Discounted first-pass model for early pilot catalogs and simple home decor items.",
    includes: ["Image-to-3D generation", "Basic optimization", "Manual review gate"]
  },
  {
    id: "verified-model",
    name: "Standard verified model",
    priceRangeEur: "70-120 EUR",
    billingUnit: "per approved model",
    description: "Primary commercial offer for furniture products that need a verified hosted AR preview.",
    includes: ["Generation provider run", "GLB/USDZ package", "Quality review and approval"]
  },
  {
    id: "hosted-pages",
    name: "Hosted pages",
    priceRangeEur: "49-99 EUR",
    billingUnit: "per month",
    description: "Monthly subscription for active public pages, merchant branding, and product engagement analytics.",
    includes: ["Public hosted product links", "CTA and AR click tracking", "Manual invoice or Stripe-ready billing"]
  },
  {
    id: "regeneration",
    name: "Regeneration",
    priceRangeEur: "Optional fee",
    billingUnit: "per extra version",
    description: "Charged only when a merchant wants additional versions after an acceptable verified model exists.",
    includes: ["Second provider run", "Replacement model review", "Hosted page asset swap"]
  }
];

export const clientConversation: ClientConversationLine[] = [
  {
    id: "client-need",
    speaker: "High-ticket client",
    line: "I do not care that it is AR. I care whether it helps a shopper trust a product enough to buy without seeing it in person."
  },
  {
    id: "maker-scope",
    speaker: "Premium service maker",
    line: "Then the product is not just a viewer. It is model prep, optimization, hosting, store placement, QA, analytics, and support."
  },
  {
    id: "client-risk",
    speaker: "High-ticket client",
    line: "I need a pilot price I can approve quickly, and I need to know the monthly bill will not surprise me."
  },
  {
    id: "maker-offer",
    speaker: "Premium service maker",
    line: "We start with 10-25 SKUs, keep the subscription tied to published products, and bill model creation separately so your recurring cost stays clean."
  }
];

export const marketReferences: MarketReference[] = [
  {
    id: "threekit",
    name: "Threekit",
    segment: "Enterprise visual commerce",
    pricingSignal: "Custom quote",
    bestFor: "Complex 3D configuration, virtual photography, AR, and sales enablement.",
    lesson: "Premium buyers pay for configurable product logic and enterprise integrations, not AR alone.",
    sourceLabel: "Threekit pricing",
    sourceUrl: "https://www.threekit.com/pricing"
  },
  {
    id: "vntana",
    name: "VNTANA",
    segment: "3D DAM and catalog infrastructure",
    pricingSignal: "Demo and quote-led",
    bestFor: "Large catalogs that need automated optimization and publishing to Shopify, Amazon, Google, and internal systems.",
    lesson: "At scale, the winning value is asset operations: upload once, optimize, govern, and distribute everywhere.",
    sourceLabel: "VNTANA 3D commerce",
    sourceUrl: "https://www.vntana.com/products/3d-commerce/"
  },
  {
    id: "zakeke",
    name: "Zakeke",
    segment: "SMB and mid-market customization",
    pricingSignal: "Self-serve and enterprise plans",
    bestFor: "Stores that need 2D customization, 3D configurators, AR viewing, and production-ready custom orders.",
    lesson: "Published-product limits are familiar to SMB buyers and keep pricing easy to compare.",
    sourceLabel: "Zakeke platform",
    sourceUrl: "https://www.zakeke.com/"
  },
  {
    id: "levar",
    name: "LEVAR",
    segment: "Shopify-first 3D/AR app",
    pricingSignal: "Free, $59, $99, and $249/month tiers by model count",
    bestFor: "Shopify merchants who want quick no-code 3D/AR product-page activation.",
    lesson: "For Shopify SMBs, model count is the clearest public pricing anchor.",
    sourceLabel: "LEVAR Shopify listing",
    sourceUrl: "https://apps.shopify.com/levar-final"
  },
  {
    id: "aritize3d",
    name: "ARitize3D / Nextech",
    segment: "Model production plus AR hosting",
    pricingSignal: "$175k, 3-year, 2,500-SKU contract disclosed in 2026",
    bestFor: "Mass SKU production where 3D modeling, hosting, and AR ecommerce are bundled.",
    lesson: "Large catalog pricing compresses per-SKU economics, so SMB pricing must protect production labor separately.",
    sourceLabel: "Nextech contract release",
    sourceUrl:
      "https://www.nextechar.com/press-releases-and-media/nextech3d.ai-signs-three-year-enterprise-3d-modeling-and-augmented-reality-e-commerce-contract-valued-at-approximately-175000?hs_amp=true"
  },
  {
    id: "shopify-native",
    name: "Shopify native 3D media",
    segment: "Free baseline",
    pricingSignal: "Included product media capability",
    bestFor: "Merchants with ready-made GLB assets and a compatible theme.",
    lesson: "The SaaS must win on workflow, QA, analytics, hosting control, and model help because basic 3D media is already possible.",
    sourceLabel: "Shopify product media",
    sourceUrl: "https://help.shopify.com/en/manual/products/product-media"
  }
];

export const billingTiers: BillingTier[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyUsd: 39,
    publishedSkuLimit: 5,
    storageGb: 2,
    monthlyViewLimit: 5000,
    positioning: "First proof for a small Shopify store.",
    includes: ["3D viewer and app-free AR", "Hosted product pages", "Basic engagement analytics", "Email support"]
  },
  {
    id: "growth",
    name: "Growth",
    monthlyUsd: 89,
    publishedSkuLimit: 20,
    storageGb: 10,
    monthlyViewLimit: 25000,
    positioning: "Best default for 10-25 SKU SMB pilots.",
    includes: ["Everything in Starter", "Shopify embed guidance", "Priority model QA queue", "CSV analytics export"],
    recommended: true
  },
  {
    id: "studio",
    name: "Studio",
    monthlyUsd: 179,
    publishedSkuLimit: 50,
    storageGb: 50,
    monthlyViewLimit: 100000,
    positioning: "For stores expanding AR across a meaningful catalog.",
    includes: ["Everything in Growth", "White-label hosted pages", "Advanced device reporting", "Launch review call"]
  },
  {
    id: "business",
    name: "Business",
    monthlyUsd: null,
    publishedSkuLimit: null,
    storageGb: null,
    monthlyViewLimit: null,
    positioning: "For 100+ SKUs, custom SLA, onboarding, and support.",
    includes: ["Custom SKU allowance", "Custom usage terms", "Dedicated onboarding", "Optional procurement contract"]
  }
];

export const overagePrices: OveragePrice[] = [
  {
    id: "extra-sku",
    name: "Extra published SKU",
    priceUsd: 5,
    unit: "per SKU/month",
    guardrail: "Keeps published catalog expansion profitable without forcing an immediate plan upgrade."
  },
  {
    id: "view-pack",
    name: "Extra view pack",
    priceUsd: 10,
    unit: "per 10k 3D/AR views",
    guardrail: "Protects bandwidth, analytics, and support during traffic spikes."
  },
  {
    id: "storage-pack",
    name: "Extra storage",
    priceUsd: 5,
    unit: "per 10GB/month",
    guardrail: "Covers raw captures, source files, GLB/USDZ packages, and poster assets."
  }
];

export const modelCreationAddons: ModelCreationAddon[] = [
  {
    id: "basic-cleanup",
    name: "Basic scan cleanup",
    priceUsd: "€79/SKU",
    buyerFit: "Simple pieces",
    useCase: "Client has usable scans but needs cleanup, naming, and upload help."
  },
  {
    id: "commerce-ready",
    name: "Ecommerce-ready GLB/USDZ optimization",
    priceUsd: "€149/SKU",
    buyerFit: "Most SMB furniture products",
    useCase: "Default add-on for SMBs that need mobile-safe files, scale checks, posters, and QA."
  },
  {
    id: "premium-pbr",
    name: "Premium manual/PBR model",
    priceUsd: "€299–€499/SKU",
    buyerFit: "Complex or luxury pieces",
    useCase: "Complex products, luxury visuals, poor source photos, or high-detail materials."
  }
];

export const costAssumptions: CostAssumption[] = [
  {
    id: "polycam",
    name: "Polycam Business",
    monthlyUsd: 400 / 12,
    costBasis: "$400/year/user",
    billingImpact: "Covered by model add-ons and platform overhead, not exposed as a client line item.",
    sourceLabel: "Polycam pricing",
    sourceUrl: "https://poly.cam/pricing"
  },
  {
    id: "cloudflare-r2",
    name: "Cloudflare R2",
    monthlyUsd: null,
    costBasis: "$0.015/GB-month after included usage; low request pricing; no egress fee.",
    billingImpact: "Main reason storage can stay generous while view packs protect heavy usage.",
    sourceLabel: "Cloudflare pricing",
    sourceUrl: "https://www.cloudflare.com/plans/"
  },
  {
    id: "vercel",
    name: "Vercel Pro",
    monthlyUsd: 20,
    costBasis: "$20/month plus usage",
    billingImpact: "Base app hosting is recovered by the first few paying accounts.",
    sourceLabel: "Vercel pricing",
    sourceUrl: "https://vercel.com/pricing"
  },
  {
    id: "domain-ops",
    name: "Domain, SSL, monitoring, support reserve",
    monthlyUsd: 25,
    costBasis: "Internal operating allowance",
    billingImpact: "Included in margin planning so the public pricing stays simple."
  }
];

export const marginScenarios: MarginScenario[] = [
  {
    id: "starter-25mb",
    label: "5 SKUs at 25MB",
    tierName: "Starter",
    skuCount: 5,
    averageAssetMb: 25,
    monthlyRevenueUsd: 39,
    estimatedVariableCostUsd: 7.2,
    storageUsedGb: 0.49
  },
  {
    id: "growth-75mb",
    label: "20 SKUs at 75MB",
    tierName: "Growth",
    skuCount: 20,
    averageAssetMb: 75,
    monthlyRevenueUsd: 89,
    estimatedVariableCostUsd: 18.5,
    storageUsedGb: 5.86
  },
  {
    id: "studio-150mb",
    label: "50 SKUs at 150MB",
    tierName: "Studio",
    skuCount: 50,
    averageAssetMb: 150,
    monthlyRevenueUsd: 179,
    estimatedVariableCostUsd: 43.2,
    storageUsedGb: 29.3
  }
];

export const usageScenarios: UsageScenario[] = [
  {
    id: "views-5k",
    monthlyViews: 5000,
    recommendedTier: "Starter",
    includedViews: 5000,
    overageUsd: 0,
    note: "Good for validating early product-page engagement."
  },
  {
    id: "views-25k",
    monthlyViews: 25000,
    recommendedTier: "Growth",
    includedViews: 25000,
    overageUsd: 0,
    note: "Default SMB pilot ceiling for 10-25 products."
  },
  {
    id: "views-100k",
    monthlyViews: 100000,
    recommendedTier: "Studio",
    includedViews: 100000,
    overageUsd: 0,
    note: "Enough for a larger seasonal catalog push."
  },
  {
    id: "views-250k",
    monthlyViews: 250000,
    recommendedTier: "Studio plus view packs",
    includedViews: 100000,
    overageUsd: 150,
    note: "Traffic spike is billed predictably at $10 per extra 10k views."
  }
];

export const modelProductionScenarios: ModelProductionScenario[] = [
  {
    id: "pilot-10",
    skuCount: 10,
    addonName: "Ecommerce-ready GLB/USDZ optimization",
    revenueUsd: 1490,
    expectedRevisions: 2,
    estimatedCogsUsd: 650
  },
  {
    id: "pilot-25",
    skuCount: 25,
    addonName: "Ecommerce-ready GLB/USDZ optimization",
    revenueUsd: 3725,
    expectedRevisions: 5,
    estimatedCogsUsd: 1625
  }
];

export const salesObjections: SalesObjection[] = [
  {
    id: "shopify-native",
    objection: "Shopify already supports 3D.",
    answer:
      "Yes, and that is the baseline. The paid value is getting files prepared, hosted, QA checked, measured, and kept mobile-safe without asking the merchant to manage a 3D pipeline."
  },
  {
    id: "levar-cheaper",
    objection: "LEVAR is cheaper or already on Shopify.",
    answer:
      "LEVAR is the pricing anchor. This offer wins with clearer model add-ons, SMB pilot packaging, independent hosted pages, and hands-on quality control for stores that do not have AR-ready files."
  },
  {
    id: "zakeke-configurator",
    objection: "Zakeke has configurators.",
    answer:
      "Zakeke is stronger when customization is the core workflow. This v1 is intentionally narrower: product viewer, AR placement, analytics, and simple published-SKU billing."
  }
];

export const qualityChecks: QualityCheck[] = [
  {
    id: "scale",
    label: "Real-world scale",
    acceptance: "Model dimensions match the product so AR placement does not mislead shoppers."
  },
  {
    id: "formats",
    label: "Optimized GLB/USDZ",
    acceptance: "GLB for web viewers and USDZ when needed for iOS AR flows."
  },
  {
    id: "materials",
    label: "PBR materials",
    acceptance: "Diffuse, normal, roughness, metalness, and occlusion maps are packaged cleanly."
  },
  {
    id: "mobile-performance",
    label: "Mobile-safe file size",
    acceptance: "Assets are compressed and preview with a poster-first loading path."
  },
  {
    id: "device-qa",
    label: "iOS and Android AR QA",
    acceptance: "Viewer opens, AR CTA appears on supported devices, and fallback behavior is clear."
  }
];

export const pilotMerchants: PilotMerchant[] = [
  {
    id: "pilot-northline",
    name: "Northline Home",
    category: "furniture",
    targetProducts: 18,
    status: "active",
    caseStudyEligible: true
  },
  {
    id: "pilot-lumina",
    name: "Lumina Living",
    category: "home_decor",
    targetProducts: 12,
    status: "pilot_offer_sent",
    caseStudyEligible: true
  },
  {
    id: "pilot-studio-vara",
    name: "Studio Vara",
    category: "furniture",
    targetProducts: 24,
    status: "contacted",
    caseStudyEligible: false
  },
  {
    id: "pilot-casa-milo",
    name: "Casa Milo",
    category: "home_decor",
    targetProducts: 10,
    status: "prospect",
    caseStudyEligible: true
  },
  {
    id: "pilot-woodmark",
    name: "Woodmark Objects",
    category: "furniture",
    targetProducts: 16,
    status: "prospect",
    caseStudyEligible: false
  }
];

export const launchMetrics: LaunchMetric[] = [
  {
    id: "upload-to-draft",
    label: "Upload to draft model",
    value: "28 min",
    target: "Under 45 min",
    status: "on_track"
  },
  {
    id: "approval-pass-rate",
    label: "Approval pass rate",
    value: "1/1",
    target: "70%+",
    status: "needs_data"
  },
  {
    id: "cost-per-usable-model",
    label: "Cost per usable model",
    value: "Manual estimate",
    target: "Below verified-model margin",
    status: "watch"
  },
  {
    id: "hosted-load-speed",
    label: "Hosted page load speed",
    value: "Mocked",
    target: "Fast poster-first load",
    status: "needs_data"
  },
  {
    id: "ar-click-rate",
    label: "AR click rate",
    value: "15.1%",
    target: "10%+",
    status: "on_track"
  },
  {
    id: "cta-click-rate",
    label: "CTA click rate",
    value: "7.5%",
    target: "3%+",
    status: "on_track"
  },
  {
    id: "merchant-renewal",
    label: "Merchant renewal",
    value: "Pending",
    target: "Renew after first month",
    status: "needs_data"
  }
];

export const expansionReadinessSignals: ExpansionReadinessSignal[] = [
  {
    id: "paying-merchants",
    label: "Paying hosted-page merchants",
    value: "1",
    target: "5-10 before integrations",
    status: "blocked"
  },
  {
    id: "active-public-pages",
    label: "Active public hosted pages",
    value: "1",
    target: "50+ pages with stable traffic",
    status: "watch"
  },
  {
    id: "renewal-proof",
    label: "First-month renewal proof",
    value: "Pending",
    target: "Majority renew after month one",
    status: "blocked"
  },
  {
    id: "repeat-requests",
    label: "Integration requests",
    value: "3 noted",
    target: "Repeated merchant pull for same channel",
    status: "watch"
  }
];

export const expansionFeatures: ExpansionFeature[] = [
  {
    id: "embed-snippet",
    rank: 1,
    name: "Simple embed snippet or iframe",
    category: "integration",
    status: "next",
    trigger: "Start after 5 paying hosted-page merchants ask to place the viewer directly on product pages.",
    merchantValue: "Lets merchants keep shoppers on their own store while reusing the verified hosted model.",
    mvpScope: [
      "Copyable iframe snippet per published product",
      "Domain allowlist and responsive sizing defaults",
      "Embed view, AR click, and CTA event tracking"
    ],
    blockedBy: ["Stable hosted-page analytics", "Published-page access control"]
  },
  {
    id: "shopify-app",
    rank: 2,
    name: "Shopify app",
    category: "commerce",
    status: "planned",
    trigger: "Prioritize when most paying pilots run Shopify and iframe embed usage is proven.",
    merchantValue: "Reduces manual copy/paste and places verified 3D/AR previews into Shopify product workflows.",
    mvpScope: [
      "OAuth install and merchant mapping",
      "Product picker connected to published hosted assets",
      "Theme app block for product pages"
    ],
    blockedBy: ["Embed snippet adoption", "Billing/account ownership model"]
  },
  {
    id: "woocommerce-plugin",
    rank: 3,
    name: "WooCommerce plugin",
    category: "commerce",
    status: "planned",
    trigger: "Build after Shopify unless pilot revenue shows stronger WooCommerce demand.",
    merchantValue: "Gives WordPress stores a direct way to attach verified 3D previews to product pages.",
    mvpScope: [
      "API key setup",
      "Product asset mapping",
      "Shortcode or block for model display"
    ],
    blockedBy: ["Public API hardening", "Embed snippet adoption"]
  },
  {
    id: "variant-configurator",
    rank: 4,
    name: "Product variant/material configurator",
    category: "commerce",
    status: "planned",
    trigger: "Start only when merchants repeatedly need color, material, or finish variants on the same base model.",
    merchantValue: "Shows multiple sellable options without regenerating unrelated product geometry.",
    mvpScope: [
      "Variant metadata per product",
      "Material swatches on hosted pages",
      "Per-variant CTA and analytics tracking"
    ],
    blockedBy: ["Consistent model packaging", "Merchant variant data quality"]
  },
  {
    id: "analytics-v2",
    rank: 5,
    name: "Merchant analytics dashboard v2",
    category: "analytics",
    status: "planned",
    trigger: "Build when merchants ask which models and placements affect buyer intent.",
    merchantValue: "Makes hosted pages and embeds measurable enough to justify renewal and expansion.",
    mvpScope: [
      "Trend charts for views, AR clicks, CTA clicks, and device mix",
      "Product comparison table",
      "CSV export for merchant reporting"
    ],
    blockedBy: ["Production event ingestion", "Enough traffic volume"]
  },
  {
    id: "bulk-import",
    rank: 6,
    name: "Bulk product import",
    category: "platform",
    status: "planned",
    trigger: "Start when paid merchants want to onboard more than 30 products at once.",
    merchantValue: "Cuts setup time for larger catalogs and makes repeat model generation operationally realistic.",
    mvpScope: [
      "CSV upload for product metadata",
      "Validation report before generation",
      "Batch status tracking"
    ],
    blockedBy: ["Generation cost controls", "Review queue capacity"]
  },
  {
    id: "white-label-pages",
    rank: 7,
    name: "White-label pages",
    category: "platform",
    status: "planned",
    trigger: "Offer after hosted links renew and larger merchants ask for brand-controlled presentation.",
    merchantValue: "Lets merchants use verified 3D pages while reducing visible third-party branding.",
    mvpScope: [
      "Custom subdomain support",
      "Logo, color, and CTA label controls",
      "Optional Veridian trust mark"
    ],
    blockedBy: ["Hosted-page subscription maturity", "Support process for DNS setup"]
  },
  {
    id: "api-access",
    rank: 8,
    name: "API access",
    category: "platform",
    status: "deferred",
    trigger: "Expose only after integration use cases are clear and internal APIs are stable.",
    merchantValue: "Lets technical merchants automate product, asset, and analytics workflows.",
    mvpScope: [
      "Read-only product and asset endpoints",
      "Scoped API keys",
      "Usage logs and rate limits"
    ],
    blockedBy: ["Auth hardening", "Public API contract"]
  },
  {
    id: "native-sdk",
    rank: 9,
    name: "Native SDK",
    category: "platform",
    status: "deferred",
    trigger: "Consider after API demand appears from mobile commerce or marketplace partners.",
    merchantValue: "Supports custom native shopping apps without one-off integration work.",
    mvpScope: [
      "iOS and Android viewer launch helpers",
      "Hosted asset loading examples",
      "AR capability detection"
    ],
    blockedBy: ["API access", "Partner-backed mobile use case"]
  },
  {
    id: "construction-showcase",
    rank: 10,
    name: "Construction/project showcase product",
    category: "vertical",
    status: "deferred",
    trigger: "Treat as a separate vertical after e-commerce revenue is proven.",
    merchantValue: "Turns uploaded CAD or existing 3D files into presentable project showcases without promising photo-to-building generation.",
    mvpScope: [
      "Upload existing GLB/CAD exports",
      "Project page with room/building viewer",
      "Lead CTA for architects or contractors"
    ],
    blockedBy: ["Separate vertical validation", "CAD/file conversion research"]
  }
];

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function getHostedProduct(merchantSlug: string, productSlug: string) {
  const hostedSlug = `${merchantSlug}/${productSlug}`;

  return products.find(
    (product) =>
      product.hostedPage?.slug === hostedSlug &&
      product.hostedPage.status === "published" &&
      product.modelAsset
  );
}

export function getPhotoSet(productId: string) {
  return photoSets.find((photoSet) => photoSet.productId === productId);
}

export function getReviewQueue() {
  return reviews.map((review) => ({
    ...review,
    product: products.find((product) => product.id === review.productId)
  }));
}

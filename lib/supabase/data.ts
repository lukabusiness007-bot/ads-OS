import { isSupabaseConfigured } from "./config";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
  isSupabaseServiceRoleConfigured
} from "./server";
import type { HostedPageAnalyticsEvent, ModelAsset, Product, ProductCategory, ProductStatus } from "@/lib/types";
import { publicUrlForKey } from "@/lib/storage/r2";
import { modelAccessPath } from "@/lib/model-access-token";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type SupabaseAdminClient = ReturnType<typeof createServiceRoleSupabaseClient>;
type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};
type DbRow = Record<string, unknown>;

export type OrganizationContext = {
  id: string;
  name: string;
  slug: string;
  planKey: string;
};

export type EnsureOrganizationResult =
  | { status: "ready"; organization: OrganizationContext }
  | { status: "unauthenticated"; organization: null }
  | { status: "setup_failed"; organization: null; errorMessage: string };

export type DashboardData = {
  isConfigured: boolean;
  organization: OrganizationContext | null;
  setupErrorMessage?: string;
  products: Product[];
  totals: {
    products: number;
    published: number;
    pageViews: number;
    embedViews: number;
    viewerInteractions: number;
    arClicks: number;
    storeClicks: number;
    processing: number;
  };
};

export async function getCurrentOrganization(supabase: SupabaseClient): Promise<OrganizationContext | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(id, name, slug, plan_key)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const organization = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;

  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    planKey: organization.plan_key ?? "starter"
  };
}

export async function getOrganizationOwnerEmail(
  client: SupabaseClient | SupabaseAdminClient,
  organizationId: string
): Promise<{ email: string; name: string | null } | null> {
  const { data, error } = await client
    .from("organization_members")
    .select("profiles(email, full_name)")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const email = (profile as { email?: string | null } | null)?.email;

  if (!email) {
    return null;
  }

  return { email, name: (profile as { full_name?: string | null } | null)?.full_name ?? null };
}

export async function ensureCurrentOrganization(supabase: SupabaseClient): Promise<EnsureOrganizationResult> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "unauthenticated",
      organization: null
    };
  }

  const existingOrganization = await getCurrentOrganization(supabase);

  if (existingOrganization) {
    return {
      status: "ready",
      organization: existingOrganization
    };
  }

  const { data, error } = await supabase
    .rpc("ensure_user_organization")
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("ensure_user_organization RPC failed", error);
    }

    const fallbackOrganization = await ensureOrganizationWithServiceRole(user).catch((adminError: unknown) => {
      console.error("Service role organization repair failed", adminError);
      return null;
    });

    if (fallbackOrganization) {
      return {
        status: "ready",
        organization: fallbackOrganization
      };
    }

    return {
      status: "setup_failed",
      organization: null,
      errorMessage:
        "Your account is signed in, but the merchant workspace could not be prepared. Apply the latest Supabase migration or configure SUPABASE_SERVICE_ROLE_KEY, then try again."
    };
  }

  return {
    status: "ready",
    organization: mapOrganizationContext(data as DbRow)
  };
}

async function ensureOrganizationWithServiceRole(user: AuthUser): Promise<OrganizationContext | null> {
  if (!isSupabaseServiceRoleConfigured()) {
    return null;
  }

  const admin = createServiceRoleSupabaseClient();
  const existingOrganization = await getExistingOrganizationForUser(admin, user.id);

  if (existingOrganization) {
    return existingOrganization;
  }

  const baseName = getUserBaseName(user);
  const baseSlug = `${slugify(baseName) || "merchant"}-${user.id.slice(0, 8)}`;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: baseName,
      email: user.email ?? null,
      avatar_url: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw profileError;
  }

  const { data: organizationRow, error: organizationError } = await admin
    .from("organizations")
    .upsert(
      {
        name: `${baseName} Store`,
        slug: baseSlug,
        updated_at: new Date().toISOString()
      },
      { onConflict: "slug" }
    )
    .select("id, name, slug, plan_key")
    .single();

  if (organizationError || !organizationRow) {
    throw organizationError ?? new Error("Organization could not be prepared.");
  }

  const organization = mapOrganizationContext(organizationRow);

  const { error: membershipError } = await admin.from("organization_members").upsert(
    {
      organization_id: organization.id,
      user_id: user.id,
      role: "owner"
    },
    { onConflict: "organization_id,user_id" }
  );

  if (membershipError) {
    throw membershipError;
  }

  const { error: billingError } = await admin.from("billing_customers").upsert(
    {
      organization_id: organization.id
    },
    { onConflict: "organization_id" }
  );

  if (billingError) {
    throw billingError;
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("id")
    .eq("organization_id", organization.id)
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    const { error: subscriptionError } = await admin.from("subscriptions").insert({
      organization_id: organization.id,
      plan_key: "starter",
      status: "trialing"
    });

    if (subscriptionError) {
      throw subscriptionError;
    }
  }

  return organization;
}

async function getExistingOrganizationForUser(admin: SupabaseAdminClient, userId: string) {
  const { data, error } = await admin
    .from("organization_members")
    .select("organization_id, organizations(id, name, slug, plan_key)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const organization = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;

  return organization ? mapOrganizationContext(organization) : null;
}

function getUserBaseName(user: AuthUser) {
  const fullName = user.user_metadata?.full_name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const emailName = user.email?.split("@")[0]?.trim();

  return emailName || "Merchant";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "merchant"
  );
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    return createEmptyDashboardData(false);
  }

  const supabase = await createServerSupabaseClient();
  const organizationResult = await ensureCurrentOrganization(supabase);

  if (organizationResult.status !== "ready") {
    return createEmptyDashboardData(
      true,
      organizationResult.status === "setup_failed" ? organizationResult.errorMessage : undefined
    );
  }

  const { organization } = organizationResult;

  const [{ data: productRows }, { data: analyticsRows }] = await Promise.all([
    supabase
      .from("products")
      .select("*, hosted_pages(*), model_assets(*)")
      .eq("organization_id", organization.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("analytics_events")
      .select("product_id, event_type, device_type")
      .eq("organization_id", organization.id)
  ]);

  const analyticsByProduct = buildAnalyticsByProduct(analyticsRows ?? []);
  const products = (productRows ?? []).map((row) => mapProductRow(row, organization, analyticsByProduct[row.id]));
  const totals = products.reduce(
    (acc, product) => {
      acc.products += 1;
      acc.published += product.hostedPage?.status === "published" ? 1 : 0;
      acc.pageViews += product.analytics?.pageViews ?? 0;
      acc.embedViews += product.analytics?.embedViews ?? 0;
      acc.viewerInteractions += product.analytics?.viewerInteractions ?? 0;
      acc.arClicks += product.analytics?.arButtonClicks ?? 0;
      acc.storeClicks += product.analytics?.ctaClicks ?? 0;
      acc.processing += product.status === "generating" ? 1 : 0;
      return acc;
    },
    {
      products: 0,
      published: 0,
      pageViews: 0,
      embedViews: 0,
      viewerInteractions: 0,
      arClicks: 0,
      storeClicks: 0,
      processing: 0
    }
  );

  return {
    isConfigured: true,
    organization,
    products,
    totals
  };
}

function mapOrganizationContext(row: DbRow): OrganizationContext {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    planKey: String(row.plan_key ?? "starter")
  };
}

export async function getPublishedProduct(merchantSlug: string, productSlug: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("hosted_pages")
    .select("*, organizations(id, name, slug), products(*, model_assets(*))")
    .eq("status", "published")
    .eq("slug", productSlug)
    .eq("organizations.slug", merchantSlug)
    .maybeSingle();

  if (!data?.products || !data.organizations) {
    return null;
  }

  const organization = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  const productRow = Array.isArray(data.products) ? data.products[0] : data.products;

  const product = mapProductRow(
    {
      ...productRow,
      hosted_pages: [data]
    },
    {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      planKey: "starter"
    }
  );

  return tokenizePublicModelDelivery(product, firstRelated(productRow.model_assets));
}

/**
 * Public model delivery must never hand out permanent, hotlinkable file URLs.
 * Swap a published product's GLB/USDZ URLs for opaque, short-lived
 * `/api/model-access/<token>` paths (Plan 2 kill switch); poster/thumbnail stay
 * public. Only formats backed by an R2 key the signing endpoint can resolve are
 * tokenized — legacy assets with only a stored public URL keep their direct URL
 * so they don't 404.
 */
function tokenizePublicModelDelivery(product: Product, assetRow: unknown): Product {
  const asset = product.modelAsset;
  if (!asset || !isDbRow(assetRow)) {
    return product;
  }

  const hasGlbKey = typeof assetRow.glb_r2_key === "string" && assetRow.glb_r2_key.length > 0;
  const hasUsdzKey = typeof assetRow.usdz_r2_key === "string" && assetRow.usdz_r2_key.length > 0;

  return {
    ...product,
    modelAsset: {
      ...asset,
      glbUrl: hasGlbKey ? modelAccessPath(product.id, "glb") : asset.glbUrl,
      usdzUrl: hasUsdzKey ? modelAccessPath(product.id, "usdz") : asset.usdzUrl
    }
  };
}

export async function recordHostedPageEvent(input: {
  merchantSlug: string;
  productSlug: string;
  eventType: HostedPageAnalyticsEvent;
  deviceType?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!isSupabaseConfigured()) {
    return { ok: false };
  }

  const supabase = await createServerSupabaseClient();
  const { data: page } = await supabase
    .from("hosted_pages")
    .select("id, organization_id, product_id, organizations!inner(slug)")
    .eq("status", "published")
    .eq("slug", input.productSlug)
    .eq("organizations.slug", input.merchantSlug)
    .maybeSingle();

  if (!page) {
    return { ok: false };
  }

  const { error } = await supabase.from("analytics_events").insert({
    organization_id: page.organization_id,
    product_id: page.product_id,
    hosted_page_id: page.id,
    event_type: input.eventType,
    device_type: input.deviceType,
    referrer: input.referrer,
    metadata: input.metadata ?? {}
  });

  return { ok: !error };
}

function createEmptyDashboardData(isConfigured: boolean, setupErrorMessage?: string): DashboardData {
  return {
    isConfigured,
    organization: null,
    setupErrorMessage,
    products: [],
    totals: {
      products: 0,
      published: 0,
      pageViews: 0,
      embedViews: 0,
      viewerInteractions: 0,
      arClicks: 0,
      storeClicks: 0,
      processing: 0
    }
  };
}

function buildAnalyticsByProduct(rows: Array<{ product_id: string | null; event_type: string; device_type: string | null }>) {
  return rows.reduce<Record<string, NonNullable<Product["analytics"]>>>((acc, row) => {
    if (!row.product_id) {
      return acc;
    }

    acc[row.product_id] ??= {
      pageViews: 0,
      embedViews: 0,
      viewerInteractions: 0,
      arButtonClicks: 0,
      ctaClicks: 0,
      topDevices: []
    };

    const analytics = acc[row.product_id];

    if (row.event_type === "page_view") analytics.pageViews += 1;
    if (row.event_type === "embed_view") analytics.embedViews += 1;
    if (row.event_type === "viewer_interaction") analytics.viewerInteractions += 1;
    if (row.event_type === "ar_button_click") analytics.arButtonClicks += 1;
    if (row.event_type === "cta_click") analytics.ctaClicks += 1;

    return acc;
  }, {});
}

function mapProductRow(row: DbRow, organization: OrganizationContext, analytics?: Product["analytics"]): Product {
  const hostedPage = firstRelated(row.hosted_pages);
  const modelAsset = firstRelated(row.model_assets);

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    category: row.category as ProductCategory,
    status: row.status as ProductStatus,
    dimensions: {
      width: Number(row.width_m ?? 0),
      height: Number(row.height_m ?? 0),
      depth: Number(row.depth_m ?? 0)
    },
    customerUrl: String(row.customer_url ?? ""),
    price: typeof row.price === "string" ? row.price : undefined,
    description: typeof row.description === "string" ? row.description : undefined,
    brandName: organization.name,
    photoCount: toNumber(row.photo_count),
    requiredAnglesComplete: row.required_angles_complete === true,
    modelAsset: isDbRow(modelAsset) ? mapModelAsset(modelAsset) : undefined,
    hostedPage: isDbRow(hostedPage)
      ? {
          slug: `${organization.slug}/${String(hostedPage.slug)}`,
          publicUrl: String(hostedPage.public_url ?? `/p/${organization.slug}/${String(hostedPage.slug)}`),
          status: hostedPage.status as NonNullable<Product["hostedPage"]>["status"],
          ctaLabel: hostedPage.cta_label === "Buy on merchant site" ? "Buy on merchant site" : "View on store"
        }
      : undefined,
    analytics
  };
}

function mapModelAsset(row: DbRow): ModelAsset {
  const glbKey = typeof row.glb_r2_key === "string" ? row.glb_r2_key : null;
  const usdzKey = typeof row.usdz_r2_key === "string" ? row.usdz_r2_key : null;
  const posterKey = typeof row.poster_r2_key === "string" ? row.poster_r2_key : null;
  return {
    glbUrl: (glbKey ? publicUrlForKey(glbKey) : null) ?? String(row.public_glb_url ?? ""),
    usdzUrl: (usdzKey ? publicUrlForKey(usdzKey) : null) ?? (typeof row.public_usdz_url === "string" ? row.public_usdz_url : undefined),
    posterUrl: (posterKey ? publicUrlForKey(posterKey) : null) ?? (typeof row.public_poster_url === "string" ? row.public_poster_url : ""),
    thumbnailUrl: (posterKey ? publicUrlForKey(posterKey) : null) ?? (typeof row.public_poster_url === "string" ? row.public_poster_url : undefined),
    fileSizeMb: toNumber(row.file_size_mb),
    triangleCount: toNumber(row.triangle_count),
    textureMax: Number(row.texture_max ?? 4096),
    dimensionsPresent: row.dimensions_present !== false,
    appliedScale: typeof row.applied_scale === "number" ? row.applied_scale : undefined
  };
}

function firstRelated<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function isDbRow(value: unknown): value is DbRow {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function getProductById(productId: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabaseClient();
  const organizationResult = await ensureCurrentOrganization(supabase);

  if (organizationResult.status !== "ready") return null;

  const { organization } = organizationResult;

  const [{ data: productRow }, { data: analyticsRows }] = await Promise.all([
    supabase
      .from("products")
      .select("*, hosted_pages(*), model_assets(*)")
      .eq("id", productId)
      .eq("organization_id", organization.id)
      .maybeSingle(),
    supabase
      .from("analytics_events")
      .select("product_id, event_type, device_type")
      .eq("organization_id", organization.id)
      .eq("product_id", productId)
  ]);

  if (!productRow) return null;

  const analyticsByProduct = buildAnalyticsByProduct(analyticsRows ?? []);
  return mapProductRow(productRow, organization, analyticsByProduct[productRow.id]);
}

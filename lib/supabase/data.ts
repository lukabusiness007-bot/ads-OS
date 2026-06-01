import { isSupabaseConfigured } from "./config";
import { createServerSupabaseClient } from "./server";
import type { HostedPageAnalyticsEvent, ModelAsset, Product, ProductCategory, ProductStatus } from "@/lib/types";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type DbRow = Record<string, unknown>;

export type OrganizationContext = {
  id: string;
  name: string;
  slug: string;
  planKey: string;
};

export type DashboardData = {
  isConfigured: boolean;
  organization: OrganizationContext | null;
  products: Product[];
  totals: {
    products: number;
    published: number;
    pageViews: number;
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

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    return createEmptyDashboardData(false);
  }

  const supabase = await createServerSupabaseClient();
  const organization = await getCurrentOrganization(supabase);

  if (!organization) {
    return createEmptyDashboardData(true);
  }

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

  return mapProductRow(
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

function createEmptyDashboardData(isConfigured: boolean): DashboardData {
  return {
    isConfigured,
    organization: null,
    products: [],
    totals: {
      products: 0,
      published: 0,
      pageViews: 0,
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
      viewerInteractions: 0,
      arButtonClicks: 0,
      ctaClicks: 0,
      topDevices: []
    };

    const analytics = acc[row.product_id];

    if (row.event_type === "page_view") analytics.pageViews += 1;
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
  return {
    glbUrl: String(row.public_glb_url ?? ""),
    usdzUrl: typeof row.public_usdz_url === "string" ? row.public_usdz_url : undefined,
    posterUrl: String(row.public_poster_url ?? ""),
    thumbnailUrl: typeof row.public_poster_url === "string" ? row.public_poster_url : undefined,
    fileSizeMb: toNumber(row.file_size_mb),
    triangleCount: toNumber(row.triangle_count),
    textureMax: Number(row.texture_max ?? 4096),
    dimensionsPresent: row.dimensions_present !== false
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

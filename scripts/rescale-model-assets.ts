/**
 * One-time backfill: rescales existing model_assets (GLB + USDZ) so they
 * match the merchant's real-world product dimensions, for assets generated
 * before AR models were baked to true scale.
 *
 * Idempotent via the `applied_scale` column: rows where it's already set are
 * skipped. Rows whose product has no usable dimensions are marked with
 * applied_scale = 1 (identity) so they aren't reprocessed every run.
 *
 * Requires (from .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * and the R2_* storage variables.
 *
 * Usage:
 *   pnpm rescale-model-assets [--dry-run]
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getGlbMetadata, optimizeGlb } from "../lib/storage/optimize-glb";
import { scaleGlbToDimensions, type ProductDimensions } from "../lib/storage/scale-glb";
import { scaleUsdzToDimensions } from "../lib/storage/scale-usdz";
import { publicUrlForKey, uploadR2Object } from "../lib/storage/r2";

const DRY_RUN = process.argv.includes("--dry-run");

type ModelAssetRow = {
  id: string;
  product_id: string;
  glb_r2_key: string | null;
  usdz_r2_key: string | null;
  public_glb_url: string | null;
  public_usdz_url: string | null;
};

type ProductRow = {
  width_m: number | null;
  height_m: number | null;
  depth_m: number | null;
};

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: assets, error } = await supabase
    .from("model_assets")
    .select("id, product_id, glb_r2_key, usdz_r2_key, public_glb_url, public_usdz_url")
    .is("applied_scale", null)
    .returns<ModelAssetRow[]>();

  if (error) {
    throw new Error(`Failed to load model_assets: ${error.message}`);
  }

  if (!assets || assets.length === 0) {
    console.log("No model_assets need rescaling.");
    return;
  }

  console.log(`Found ${assets.length} model_asset(s) without applied_scale.${DRY_RUN ? " (dry run)" : ""}`);

  for (const asset of assets) {
    await processAsset(supabase, asset);
  }
}

async function processAsset(
  supabase: SupabaseClient,
  asset: ModelAssetRow
) {
  console.log(`\n[${asset.id}] product ${asset.product_id}`);

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("width_m, height_m, depth_m")
    .eq("id", asset.product_id)
    .maybeSingle()
    .returns<ProductRow>();

  if (productError) {
    console.warn(`  skip: could not load product (${productError.message})`);
    return;
  }

  const dimensions: ProductDimensions | null = product
    ? { width: product.width_m, height: product.height_m, depth: product.depth_m }
    : null;

  const glbKey = asset.glb_r2_key;
  const glbUrl = (glbKey ? publicUrlForKey(glbKey) : null) ?? asset.public_glb_url;

  if (!glbKey || !glbUrl) {
    console.warn("  skip: no GLB key/url on this asset");
    return;
  }

  const glb = await downloadAsset(glbUrl);
  const scaled = dimensions ? await scaleGlbToDimensions(glb, dimensions) : null;

  if (!scaled) {
    console.log("  no usable dimensions — marking as identity scale");
    if (!DRY_RUN) {
      await updateAsset(supabase, asset.id, { applied_scale: 1, dimensions_present: false });
    }
    return;
  }

  console.log(`  applying scale factor ${scaled.appliedScale}`);

  const optimized = await optimizeGlb(scaled.buffer);
  const glbBody = optimized?.buffer ?? scaled.buffer;
  const metadata = optimized ?? (await getGlbMetadata(scaled.buffer));

  if (DRY_RUN) {
    console.log(`  would re-upload GLB (${metadata.fileSizeMb} MB) to ${glbKey}`);
  } else {
    await uploadR2Object({ key: glbKey, body: glbBody, contentType: "model/gltf-binary" });
  }

  const usdzKey = asset.usdz_r2_key;
  const usdzUrl = (usdzKey ? publicUrlForKey(usdzKey) : null) ?? asset.public_usdz_url;

  if (usdzKey && usdzUrl) {
    const usdz = await downloadAsset(usdzUrl);
    const scaledUsdz = scaleUsdzToDimensions(usdz, scaled.appliedScale);
    const usdzBody = scaledUsdz?.buffer ?? usdz;

    if (DRY_RUN) {
      console.log(`  would re-upload USDZ${scaledUsdz ? "" : " (unchanged — rescale failed)"} to ${usdzKey}`);
    } else {
      await uploadR2Object({ key: usdzKey, body: usdzBody, contentType: "model/vnd.usdz+zip" });
    }
  }

  if (!DRY_RUN) {
    await updateAsset(supabase, asset.id, {
      applied_scale: scaled.appliedScale,
      dimensions_present: true,
      file_size_mb: metadata.fileSizeMb,
      triangle_count: metadata.triangleCount,
      texture_max: metadata.textureMax
    });
  }

  console.log("  done");
}

async function downloadAsset(url: string): Promise<Buffer> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function updateAsset(
  supabase: SupabaseClient,
  id: string,
  updates: Record<string, unknown>
) {
  const { error } = await supabase.from("model_assets").update(updates).eq("id", id);

  if (error) {
    throw new Error(`Failed to update model_asset ${id}: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

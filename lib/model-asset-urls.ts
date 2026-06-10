import type { AdminModelAsset, ModelAsset } from "@/lib/types";
import { publicUrlForKey } from "@/lib/storage/r2";

/** Derive viewer-ready URLs from a model_assets row, falling back to stored public URLs. */
export function viewerAssetFromModelAssetRow(
  row: AdminModelAsset
): Pick<ModelAsset, "glbUrl" | "usdzUrl" | "posterUrl" | "dimensionsPresent"> {
  return {
    glbUrl: (row.glb_r2_key ? publicUrlForKey(row.glb_r2_key) : null) ?? row.public_glb_url ?? "",
    usdzUrl: (row.usdz_r2_key ? publicUrlForKey(row.usdz_r2_key) : null) ?? row.public_usdz_url ?? undefined,
    posterUrl: (row.poster_r2_key ? publicUrlForKey(row.poster_r2_key) : null) ?? row.public_poster_url ?? "",
    dimensionsPresent: row.dimensions_present ?? undefined
  };
}

import { NextResponse } from "next/server";
import {
  getFriendlyMeshyTaskMessage,
  getMeshyMultiImageTask,
  mapMeshyStatus,
  MeshyConfigurationError,
  MeshyRequestError,
  type MeshyTask
} from "@/lib/providers/meshy";
import { createModelAssetKey, createOrganizationModelAssetKey, uploadR2Object } from "@/lib/storage/r2";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentOrganization } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GenerationStatusResponse, ModelAsset } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const taskId = searchParams.get("taskId");

  if (!productId || !taskId) {
    return NextResponse.json(
      {
        status: "failed",
        progress: 0,
        message: "Generation status is missing the product or task id.",
        errorMessage: "Open the product creation page and start generation again."
      } satisfies GenerationStatusResponse,
      { status: 400 }
    );
  }

  try {
    const supabase = isSupabaseConfigured() ? await createServerSupabaseClient() : null;
    const organization = supabase ? await getCurrentOrganization(supabase) : null;
    const task = await getMeshyMultiImageTask(taskId);
    const status = mapMeshyStatus(task.status);

    if (status === "failed") {
      if (supabase && organization) {
        await updateGenerationJobStatus(supabase, organization.id, productId, taskId, "failed", task.progress ?? 100);
      }

      return NextResponse.json({
        status,
        progress: task.progress ?? 100,
        message: getFriendlyMeshyTaskMessage(task),
        errorMessage: getFriendlyMeshyTaskMessage(task)
      } satisfies GenerationStatusResponse);
    }

    if (status !== "succeeded") {
      if (supabase && organization) {
        await updateGenerationJobStatus(supabase, organization.id, productId, taskId, status, task.progress ?? 0);
      }

      return NextResponse.json({
        status,
        progress: task.progress ?? 0,
        message: getFriendlyMeshyTaskMessage(task)
      } satisfies GenerationStatusResponse);
    }

    const asset = await storeMeshyTaskAssets(productId, taskId, task, organization?.id);

    if (supabase && organization) {
      await persistCompletedGeneration(supabase, organization.id, productId, taskId, asset);
    }

    return NextResponse.json({
      status: "succeeded",
      progress: 100,
      message: "Your model is ready for review.",
      asset
    } satisfies GenerationStatusResponse);
  } catch (error) {
    return handleStatusError(error);
  }
}

async function storeMeshyTaskAssets(
  productId: string,
  taskId: string,
  task: MeshyTask,
  organizationId?: string
): Promise<ModelAsset> {
  const glbUrl = task.model_urls?.glb;

  if (!glbUrl) {
    throw new Error("Meshy did not return a GLB model.");
  }

  const glb = await downloadRemoteAsset(glbUrl, "model/gltf-binary");
  const glbUpload = await uploadR2Object({
    key: createAssetKey(productId, taskId, "model.glb", organizationId),
    body: glb.body,
    contentType: glb.contentType
  });

  const usdz = task.model_urls?.usdz
    ? await downloadRemoteAsset(task.model_urls.usdz, "model/vnd.usdz+zip")
    : null;
  const usdzUpload = usdz
    ? await uploadR2Object({
        key: createAssetKey(productId, taskId, "model.usdz", organizationId),
        body: usdz.body,
        contentType: usdz.contentType
      })
    : null;

  const posterSourceUrl = task.thumbnail_urls?.front ?? task.thumbnail_url;
  const poster = posterSourceUrl ? await downloadRemoteAsset(posterSourceUrl, "image/png") : null;
  const posterUpload = poster
    ? await uploadR2Object({
        key: createAssetKey(productId, taskId, "poster.png", organizationId),
        body: poster.body,
        contentType: poster.contentType
      })
    : null;

  return {
    glbUrl: glbUpload.url,
    usdzUrl: usdzUpload?.url,
    posterUrl: posterUpload?.url ?? "",
    thumbnailUrl: posterUpload?.url,
    fileSizeMb: Number((glb.body.length / 1024 / 1024).toFixed(2)),
    triangleCount: 0,
    textureMax: 4096,
    dimensionsPresent: true
  };
}

function createAssetKey(productId: string, taskId: string, fileName: string, organizationId?: string) {
  return organizationId
    ? createOrganizationModelAssetKey(organizationId, productId, taskId, fileName)
    : createModelAssetKey(productId, taskId, fileName);
}

async function updateGenerationJobStatus(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  organizationId: string,
  productId: string,
  taskId: string,
  status: "queued" | "running" | "succeeded" | "failed",
  progress: number
) {
  await supabase
    .from("generation_jobs")
    .update({
      status,
      progress,
      provider_status: status,
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .eq("provider_job_id", taskId);
}

async function persistCompletedGeneration(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  organizationId: string,
  productId: string,
  taskId: string,
  asset: ModelAsset
) {
  const { data: job } = await supabase
    .from("generation_jobs")
    .update({
      status: "succeeded",
      progress: 100,
      provider_status: "succeeded",
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .eq("provider_job_id", taskId)
    .select("id")
    .maybeSingle();

  const { data: existingAsset } = await supabase
    .from("model_assets")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .eq("generation_job_id", job?.id ?? "")
    .maybeSingle();

  if (!existingAsset) {
    await supabase.from("model_assets").insert({
      organization_id: organizationId,
      product_id: productId,
      generation_job_id: job?.id ?? null,
      glb_r2_key: createOrganizationModelAssetKey(organizationId, productId, taskId, "model.glb"),
      usdz_r2_key: asset.usdzUrl ? createOrganizationModelAssetKey(organizationId, productId, taskId, "model.usdz") : null,
      poster_r2_key: asset.posterUrl ? createOrganizationModelAssetKey(organizationId, productId, taskId, "poster.png") : null,
      public_glb_url: asset.glbUrl,
      public_usdz_url: asset.usdzUrl ?? null,
      public_poster_url: asset.posterUrl || null,
      file_size_mb: asset.fileSizeMb,
      triangle_count: asset.triangleCount,
      texture_max: asset.textureMax,
      dimensions_present: asset.dimensionsPresent ?? true
    });
  }

  await supabase
    .from("products")
    .update({
      status: "awaiting_review",
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("id", productId);

  await supabase.from("reviews").insert({
    organization_id: organizationId,
    product_id: productId,
    status: "pending",
    notes: "Generated model is ready for quality review."
  });
}

async function downloadRemoteAsset(url: string, fallbackContentType: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not download generated model asset.");
  }

  const body = Buffer.from(await response.arrayBuffer());

  return {
    body,
    contentType: response.headers.get("content-type") ?? fallbackContentType
  };
}

function handleStatusError(error: unknown) {
  if (error instanceof MeshyConfigurationError) {
    return NextResponse.json(
      {
        status: "failed",
        progress: 0,
        message: "The generation service is not configured yet.",
        errorMessage: "Add the Meshy API key and try again."
      } satisfies GenerationStatusResponse,
      { status: 500 }
    );
  }

  if (error instanceof MeshyRequestError) {
    return NextResponse.json(
      {
        status: "failed",
        progress: 0,
        message: "We could not check this generation run yet.",
        errorMessage: "Try refreshing in a moment."
      } satisfies GenerationStatusResponse,
      { status: error.statusCode >= 500 ? 502 : error.statusCode }
    );
  }

  if (error instanceof Error && error.message === "R2 storage is not configured.") {
    return NextResponse.json(
      {
        status: "failed",
        progress: 100,
        message: "The model was generated, but asset storage is not configured.",
        errorMessage: "Add the R2 environment variables and poll status again."
      } satisfies GenerationStatusResponse,
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      status: "failed",
      progress: 0,
      message: "We could not finish packaging this model.",
      errorMessage: "Please try again."
    } satisfies GenerationStatusResponse,
    { status: 500 }
  );
}

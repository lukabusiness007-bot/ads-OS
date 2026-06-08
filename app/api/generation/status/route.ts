import { NextResponse } from "next/server";
import { sendAdminNotificationEmail } from "@/lib/admin/email";
import {
  getFriendlyMeshyRequestErrorMessage,
  getFriendlyMeshyTaskMessage,
  getMeshyTaskFailureDetails,
  getMeshyMultiImageTask,
  mapMeshyStatus,
  MeshyConfigurationError,
  MeshyRequestError,
  type MeshyTask
} from "@/lib/providers/meshy";
import {
  R2ConfigurationError,
  R2RequestError,
  createModelAssetKey,
  createOrganizationModelAssetKey,
  uploadR2Object
} from "@/lib/storage/r2";
import { getGlbMetadata, optimizeGlb } from "@/lib/storage/optimize-glb";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentOrganization } from "@/lib/supabase/data";
import { createServerSupabaseClient, createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import type { GenerationStatusResponse, ModelAsset } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
    const adminClient = organization && isSupabaseServiceRoleConfigured() ? createServiceRoleSupabaseClient() : null;
    const writeClient = adminClient ?? supabase;
    const task = await getMeshyMultiImageTask(taskId);
    const status = mapMeshyStatus(task.status);

    if (status === "failed") {
      const failure = getMeshyTaskFailureDetails(task);

      console.warn("Generation task failed", {
        productId,
        taskId,
        taskStatus: task.status,
        taskError: task.task_error ?? null,
        friendlyCode: failure.code
      });

      if (writeClient && organization) {
        const jobId = await updateGenerationJobStatus(
          writeClient,
          organization.id,
          productId,
          taskId,
          "failed",
          task.progress ?? 100,
          task,
          failure.message
        );
        await markProductGenerationFailed(writeClient, organization.id, productId);
        await insertGenerationJobEvent(writeClient, organization.id, jobId, "generation_failed", failure.message, {
          code: failure.code,
          retryable: failure.retryable,
          providerStatus: task.status
        });
      }

      return NextResponse.json({
        status,
        progress: task.progress ?? 100,
        message: failure.message,
        errorMessage: failure.message,
        failureCode: failure.code,
        retryable: failure.retryable
      } satisfies GenerationStatusResponse);
    }

    if (status !== "succeeded") {
      if (writeClient && organization) {
        await updateGenerationJobStatus(writeClient, organization.id, productId, taskId, status, task.progress ?? 0, task);
      }

      return NextResponse.json({
        status,
        progress: task.progress ?? 0,
        message: getFriendlyMeshyTaskMessage(task)
      } satisfies GenerationStatusResponse);
    }

    let asset: ModelAsset;

    try {
      asset = await storeMeshyTaskAssets(productId, taskId, task, organization?.id);
    } catch (error) {
      const failureMessage = getPackagingFailureMessage(error);

      console.error("Generated model packaging failed", {
        productId,
        taskId,
        taskStatus: task.status,
        error: toSafeErrorLog(error)
      });

      if (writeClient && organization) {
        const jobId = await updateGenerationJobStatus(
          writeClient,
          organization.id,
          productId,
          taskId,
          "failed",
          100,
          task,
          failureMessage
        );
        await markProductGenerationFailed(writeClient, organization.id, productId);
        await insertGenerationJobEvent(writeClient, organization.id, jobId, "packaging_failed", failureMessage, {
          providerStatus: task.status
        });
      }

      return createPackagingFailureResponse(error);
    }

    console.info("Generated model packaged for preview", {
      productId,
      taskId,
      provider: "meshy",
      generationType: "multi-image-to-3d",
      meshyGlbUrl: task.model_urls?.glb ?? null,
      storedGlbUrl: asset.glbUrl,
      renderedSource: asset.glbUrl
    });

    if (writeClient && organization) {
      await persistCompletedGeneration(writeClient, organization.id, productId, taskId, asset, task);
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
  const optimizedGlb = await optimizeGlb(glb.body);
  const modelBody = optimizedGlb?.buffer ?? glb.body;
  const modelMetadata = optimizedGlb ?? await getGlbMetadata(glb.body);

  const glbUpload = await uploadR2Object({
    key: createAssetKey(productId, taskId, "model.glb", organizationId),
    body: modelBody,
    contentType: "model/gltf-binary"
  });

  if (optimizedGlb) {
    try {
      await uploadR2Object({
        key: createAssetKey(productId, taskId, "model-source.glb", organizationId),
        body: glb.body,
        contentType: "model/gltf-binary"
      });
    } catch (error) {
      console.warn("Raw Meshy GLB backup upload failed after optimized model upload", toSafeErrorLog(error));
    }
  }

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
    fileSizeMb: modelMetadata.fileSizeMb,
    triangleCount: modelMetadata.triangleCount,
    textureMax: modelMetadata.textureMax,
    dimensionsPresent: true
  };
}

function createAssetKey(productId: string, taskId: string, fileName: string, organizationId?: string) {
  return organizationId
    ? createOrganizationModelAssetKey(organizationId, productId, taskId, fileName)
    : createModelAssetKey(productId, taskId, fileName);
}

async function updateGenerationJobStatus(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string,
  productId: string,
  taskId: string,
  status: "queued" | "running" | "succeeded" | "failed",
  progress: number,
  task?: MeshyTask,
  errorMessage?: string
) {
  const updates: Record<string, unknown> = {
    status,
    progress,
    provider_status: task?.status ?? status,
    error_message: status === "failed" ? errorMessage ?? null : null,
    updated_at: new Date().toISOString()
  };

  if (task) {
    updates.raw_provider_payload = task;
  }

  const { data } = await supabase
    .from("generation_jobs")
    .update(updates)
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .eq("provider_job_id", taskId)
    .select("id")
    .maybeSingle();

  return typeof data?.id === "string" ? data.id : null;
}

async function persistCompletedGeneration(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string,
  productId: string,
  taskId: string,
  asset: ModelAsset,
  task: MeshyTask
) {
  const { data: job } = await supabase
    .from("generation_jobs")
    .update({
      status: "succeeded",
      progress: 100,
      provider_status: task.status,
      error_message: null,
      raw_provider_payload: task,
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

  // Best-effort admin email — never blocks the response
  const { data: productRow } = await supabase.from("products").select("name").eq("id", productId).maybeSingle();
  const { data: orgRow } = await supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle();
  sendAdminNotificationEmail({
    productId,
    productName: (productRow as { name?: string } | null)?.name ?? "Unknown product",
    merchantName: (orgRow as { name?: string } | null)?.name ?? "Unknown merchant",
    action: "awaiting_review"
  }).catch(() => undefined);
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

async function markProductGenerationFailed(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string,
  productId: string
) {
  await supabase
    .from("products")
    .update({
      status: "generation_failed",
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("id", productId);

  // Best-effort admin email
  const { data: productRow } = await supabase.from("products").select("name").eq("id", productId).maybeSingle();
  const { data: orgRow } = await supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle();
  sendAdminNotificationEmail({
    productId,
    productName: (productRow as { name?: string } | null)?.name ?? "Unknown product",
    merchantName: (orgRow as { name?: string } | null)?.name ?? "Unknown merchant",
    action: "generation_failed"
  }).catch(() => undefined);
}

async function insertGenerationJobEvent(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string,
  jobId: string | null,
  eventType: string,
  message: string,
  payload: Record<string, unknown>
) {
  if (!jobId) {
    return;
  }

  await supabase.from("job_events").insert({
    organization_id: organizationId,
    job_id: jobId,
    event_type: eventType,
    message,
    payload
  });
}

function createPackagingFailureResponse(error: unknown, statusCode = 200) {
  const message = getPackagingFailureMessage(error);

  return NextResponse.json(
    {
      status: "failed",
      progress: 100,
      message,
      errorMessage: message,
      failureCode: getPackagingFailureCode(error),
      retryable: !(error instanceof R2ConfigurationError)
    } satisfies GenerationStatusResponse,
    { status: statusCode }
  );
}

function getPackagingFailureMessage(error: unknown) {
  if (error instanceof R2ConfigurationError) {
    // Surface the specific reason (e.g. public base URL pointing at the S3
    // endpoint) when present; otherwise fall back to the generic guidance.
    return error.message && error.message !== "R2 storage is not configured."
      ? `The model was generated, but asset storage is misconfigured: ${error.message}`
      : "The model was generated, but asset storage is not configured. Add the R2 environment variables and poll status again.";
  }

  if (error instanceof R2RequestError) {
    return "The model was generated, but storage could not save the GLB/USDZ files. Check the R2 bucket, endpoint, access key permissions, and public base URL.";
  }

  if (error instanceof Error && error.message === "Meshy did not return a GLB model.") {
    return "The generation finished without the required GLB file. Start a new generation so the web model can be requested again.";
  }

  if (error instanceof Error && error.message === "Could not download generated model asset.") {
    return "The generated model file could not be downloaded for packaging. Refresh once; if it repeats, start a new generation.";
  }

  return "The model was generated, but the web and AR files could not be packaged. Please try again.";
}

function getPackagingFailureCode(error: unknown) {
  if (error instanceof R2ConfigurationError) {
    return "storage_not_configured";
  }

  if (error instanceof R2RequestError) {
    return "storage_request_failed";
  }

  if (error instanceof Error && error.message === "Meshy did not return a GLB model.") {
    return "missing_glb";
  }

  if (error instanceof Error && error.message === "Could not download generated model asset.") {
    return "asset_download_failed";
  }

  return "packaging_failed";
}

function handleStatusError(error: unknown) {
  console.error("Generation status check failed", toSafeErrorLog(error));

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
    const message = getFriendlyMeshyRequestErrorMessage(error);

    return NextResponse.json(
      {
        status: "failed",
        progress: 0,
        message,
        errorMessage: message,
        failureCode: `request_${error.statusCode}`,
        retryable: error.statusCode === 429 || error.statusCode >= 500
      } satisfies GenerationStatusResponse,
      { status: error.statusCode >= 500 ? 502 : error.statusCode }
    );
  }

  if (error instanceof R2ConfigurationError) {
    return createPackagingFailureResponse(error, 500);
  }

  if (error instanceof R2RequestError) {
    return createPackagingFailureResponse(error, 502);
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

function toSafeErrorLog(error: unknown) {
  if (error instanceof MeshyRequestError) {
    return {
      name: error.name,
      statusCode: error.statusCode,
      message: error.message
    };
  }

  if (error instanceof R2RequestError) {
    return {
      name: error.name,
      operation: error.operation,
      cause: getSafeCause(error.cause)
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return { message: String(error) };
}

function getSafeCause(cause: unknown) {
  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message
    };
  }

  return String(cause);
}

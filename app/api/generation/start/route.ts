import { NextResponse } from "next/server";
import {
  MAX_GENERATION_PHOTO_BYTES_TOTAL,
  MAX_GENERATION_PHOTO_SIZE_BYTES,
  MAX_GENERATION_PHOTOS,
  MIN_GENERATION_PHOTOS,
  SUPPORTED_GENERATION_IMAGE_TYPES,
  formatMegabytes
} from "@/lib/generation-upload";
import {
  createMeshyMultiImageTask,
  getFriendlyMeshyRequestErrorMessage,
  MeshyConfigurationError,
  MeshyRequestError
} from "@/lib/providers/meshy";
import { DEMO_ORG_ID, R2ConfigurationError, R2RequestError, createPresignedR2GetUrl } from "@/lib/storage/r2";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureCurrentOrganization } from "@/lib/supabase/data";
import { createServerSupabaseClient, createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { getGenerationUsageSummary, type GenerationSource } from "@/lib/billing/usage";
import type {
  GenerationPhotoContentType,
  GenerationUploadPhoto,
  StartGenerationRequest,
  StartGenerationResponse
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERATION_INPUT_URL_EXPIRES_IN_SECONDS = 6 * 60 * 60;

// DB-backed rate limit (serverless-safe — no in-memory state). Counts how many
// generation jobs an organization started inside the rolling window.
const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX_JOBS_PER_WINDOW = 15;

const MAX_PRODUCT_ID_LENGTH = 64;
const MAX_PHOTO_FILE_NAME_LENGTH = 255;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<StartGenerationRequest>;
    const productId = typeof payload.productId === "string" ? payload.productId : "";
    const photos = Array.isArray(payload.photos) ? payload.photos : [];
    const supabase = isSupabaseConfigured() ? await createServerSupabaseClient() : null;
    const organizationResult = supabase ? await ensureCurrentOrganization(supabase) : null;

    if (organizationResult?.status === "unauthenticated") {
      return NextResponse.json({ errorMessage: "Sign in before starting generation." }, { status: 401 });
    }

    if (organizationResult?.status === "setup_failed") {
      return NextResponse.json({ errorMessage: organizationResult.errorMessage }, { status: 500 });
    }

    const organization = organizationResult?.organization ?? null;
    const adminClient = organization && isSupabaseServiceRoleConfigured() ? createServiceRoleSupabaseClient() : null;
    const objectOwnerId = organization?.id ?? DEMO_ORG_ID;
    const validationError = validateStartPayload(productId, photos, objectOwnerId);

    if (validationError) {
      return NextResponse.json({ errorMessage: validationError }, { status: 400 });
    }

    // Source of the credit this generation will consume ('included' first, then
    // 'topup'). Recorded on the usage_event so carry-over top-ups are tracked.
    let generationSource: GenerationSource = "included";

    if (organization) {
      const rateLimited = await isOrganizationRateLimited(adminClient ?? supabase!, organization.id);

      if (rateLimited) {
        return NextResponse.json(
          {
            errorMessage: `You have started too many generations recently. Wait a few minutes — up to ${RATE_LIMIT_MAX_JOBS_PER_WINDOW} generations are allowed per ${RATE_LIMIT_WINDOW_MINUTES} minutes.`,
            failureCode: "rate_limited"
          },
          { status: 429 }
        );
      }

      const usage = await getGenerationUsageSummary(adminClient ?? supabase!, organization.id, organization.planKey);

      if (!usage.canGenerate) {
        return NextResponse.json(
          {
            errorMessage:
              "You have used all model generations included in your plan. Buy a generation top-up pack or upgrade your plan to keep creating models.",
            failureCode: "generation_quota_exceeded"
          },
          { status: 402 }
        );
      }

      generationSource = usage.nextSource ?? "included";

      await persistUploadedPhotos(adminClient ?? supabase!, organization.id, productId, photos);
    }

    let taskId: string;

    try {
      const imageUrls = await Promise.all(
        photos.map((photo) => createPresignedR2GetUrl(photo.key, GENERATION_INPUT_URL_EXPIRES_IN_SECONDS))
      );
      taskId = await createMeshyMultiImageTask(imageUrls, {
        imageEnhancement: payload.imageEnhancement === true
      });
    } catch (error) {
      if (organization) {
        await markProductGenerationFailed(adminClient ?? supabase!, organization.id, productId);
      }

      throw error;
    }

    if (organization) {
      await createGenerationJobRecord(adminClient ?? supabase!, organization.id, productId, taskId, generationSource);
    }

    const response: StartGenerationResponse = {
      productId,
      taskId,
      status: "queued"
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleStartError(error);
  }
}

async function isOrganizationRateLimited(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string
) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("started_at", windowStart);

  if (error) {
    // Fail open: never block a legitimate generation because the limiter query
    // failed. The error is logged for visibility.
    console.error("Generation rate-limit check failed", { message: error.message });
    return false;
  }

  return (count ?? 0) >= RATE_LIMIT_MAX_JOBS_PER_WINDOW;
}

function validateStartPayload(productId: string, photos: GenerationUploadPhoto[], objectOwnerId: string) {
  if (!productId || productId.length > MAX_PRODUCT_ID_LENGTH || !/^[a-z0-9-]+$/.test(productId)) {
    return "Generation is missing a valid product upload id. Please prepare the photos again.";
  }

  if (photos.length < MIN_GENERATION_PHOTOS || photos.length > MAX_GENERATION_PHOTOS) {
    return `Upload exactly ${MAX_GENERATION_PHOTOS} product photos before starting generation.`;
  }

  const uniqueKeys = new Set(photos.map((photo) => photo.key));

  if (uniqueKeys.size !== photos.length) {
    return "The uploaded photo set contains duplicates. Please prepare the photos again.";
  }

  const invalidPhoto = photos.find((photo) => !isGenerationPhoto(objectOwnerId, productId, photo));

  if (invalidPhoto) {
    return "The uploaded photo set is invalid. Please prepare the photos again.";
  }

  const oversizedPhoto = photos.find((photo) => photo.size > MAX_GENERATION_PHOTO_SIZE_BYTES);

  if (oversizedPhoto) {
    return `One prepared photo is still larger than ${formatMegabytes(
      MAX_GENERATION_PHOTO_SIZE_BYTES
    )}. Try a clearer source photo with fewer pixels.`;
  }

  const totalPhotoBytes = photos.reduce((total, photo) => total + photo.size, 0);

  if (totalPhotoBytes > MAX_GENERATION_PHOTO_BYTES_TOTAL) {
    return `The prepared photos are still too large together. The app needs the generated upload under ${formatMegabytes(
      MAX_GENERATION_PHOTO_BYTES_TOTAL
    )}.`;
  }

  return "";
}

async function persistUploadedPhotos(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string,
  productId: string,
  photos: GenerationUploadPhoto[]
) {
  const photoRows = photos.map((photo, index) => ({
    organization_id: organizationId,
    product_id: productId,
    r2_key: photo.key,
    file_name: photo.fileName,
    file_type: photo.contentType,
    angle: ["front", "right", "back", "top_angle"][index] ?? "extra_angle",
    size_bytes: photo.size
  }));

  await supabase.from("product_photos").insert(photoRows);
  await supabase
    .from("products")
    .update({
      status: "generating",
      photo_count: photos.length,
      required_angles_complete: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", productId)
    .eq("organization_id", organizationId);
}

async function createGenerationJobRecord(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | ReturnType<typeof createServiceRoleSupabaseClient>,
  organizationId: string,
  productId: string,
  taskId: string,
  generationSource: GenerationSource
) {
  const { data } = await supabase
    .from("generation_jobs")
    .insert({
      organization_id: organizationId,
      product_id: productId,
      provider: "meshy",
      provider_job_id: taskId,
      status: "queued",
      provider_status: "queued",
      raw_provider_payload: { taskId }
    })
    .select("id")
    .single();

  if (data?.id) {
    await supabase.from("job_events").insert({
      organization_id: organizationId,
      job_id: data.id,
      event_type: "generation_started",
      message: "Generation started from uploaded product photos.",
      payload: { taskId }
    });
  }

  await supabase.from("usage_events").insert({
    organization_id: organizationId,
    product_id: productId,
    event_type: "generation_started",
    quantity: 1,
    metadata: { taskId, source: generationSource }
  });
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
    .eq("id", productId)
    .eq("organization_id", organizationId);
}

function isGenerationPhoto(objectOwnerId: string, productId: string, photo: GenerationUploadPhoto) {
  return (
    typeof photo.key === "string" &&
    photo.key.startsWith(`product-photos/${objectOwnerId}/${productId}/`) &&
    typeof photo.fileName === "string" &&
    photo.fileName.trim().length > 0 &&
    photo.fileName.length <= MAX_PHOTO_FILE_NAME_LENGTH &&
    isSupportedPhotoType(photo.contentType) &&
    Number.isFinite(photo.size) &&
    photo.size > 0
  );
}

function isSupportedPhotoType(type: unknown): type is GenerationPhotoContentType {
  return typeof type === "string" && SUPPORTED_GENERATION_IMAGE_TYPES.has(type.toLowerCase());
}

function handleStartError(error: unknown) {
  console.error("Generation start failed", toSafeErrorLog(error));

  if (error instanceof MeshyConfigurationError) {
    return NextResponse.json(
      { errorMessage: "The generation service is not configured yet. Add the required API key and try again." },
      { status: 500 }
    );
  }

  if (error instanceof MeshyRequestError) {
    return NextResponse.json(
      { errorMessage: getFriendlyMeshyRequestErrorMessage(error) },
      { status: error.statusCode >= 500 ? 502 : error.statusCode }
    );
  }

  if (error instanceof R2ConfigurationError) {
    return NextResponse.json(
      {
        errorMessage: "Storage is not configured yet. Add the R2 environment variables and try again.",
        failureCode: "storage_not_configured"
      },
      { status: 500 }
    );
  }

  if (error instanceof R2RequestError) {
    return NextResponse.json(
      {
        errorMessage:
          "Storage could not create private photo links for generation. Check the R2 bucket name, endpoint, and access key permissions.",
        failureCode: "storage_request_failed"
      },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { errorMessage: "We could not start generation. Please try again.", failureCode: "generation_start_failed" },
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

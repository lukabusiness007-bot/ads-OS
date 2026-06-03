import { NextResponse } from "next/server";
import {
  MAX_GENERATION_PHOTO_BYTES_TOTAL,
  MAX_GENERATION_PHOTO_SIZE_BYTES,
  REQUIRED_GENERATION_PHOTOS,
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
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  GenerationPhotoContentType,
  GenerationUploadPhoto,
  StartGenerationRequest,
  StartGenerationResponse
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERATION_INPUT_URL_EXPIRES_IN_SECONDS = 6 * 60 * 60;

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
    const objectOwnerId = organization?.id ?? DEMO_ORG_ID;
    const validationError = validateStartPayload(productId, photos, objectOwnerId);

    if (validationError) {
      return NextResponse.json({ errorMessage: validationError }, { status: 400 });
    }

    if (supabase && organization) {
      await persistUploadedPhotos(supabase, organization.id, productId, photos);
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
      if (supabase && organization) {
        await markProductGenerationFailed(supabase, organization.id, productId);
      }

      throw error;
    }

    if (supabase && organization) {
      await createGenerationJobRecord(supabase, organization.id, productId, taskId);
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

function validateStartPayload(productId: string, photos: GenerationUploadPhoto[], objectOwnerId: string) {
  if (!productId || !/^[a-z0-9-]+$/.test(productId)) {
    return "Generation is missing a valid product upload id. Please prepare the photos again.";
  }

  if (photos.length !== REQUIRED_GENERATION_PHOTOS) {
    return "Upload exactly 4 product photos before starting generation.";
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
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
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
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  organizationId: string,
  productId: string,
  taskId: string
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
    metadata: { taskId }
  });
}

async function markProductGenerationFailed(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
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
      { errorMessage: "The generation service is not configured yet. Add the Meshy API key and try again." },
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

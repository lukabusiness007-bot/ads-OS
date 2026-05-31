import { NextResponse } from "next/server";
import {
  getFriendlyMeshyTaskMessage,
  getMeshyMultiImageTask,
  mapMeshyStatus,
  MeshyConfigurationError,
  MeshyRequestError,
  type MeshyTask
} from "@/lib/providers/meshy";
import { createModelAssetKey, uploadR2Object } from "@/lib/storage/r2";
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
    const task = await getMeshyMultiImageTask(taskId);
    const status = mapMeshyStatus(task.status);

    if (status === "failed") {
      return NextResponse.json({
        status,
        progress: task.progress ?? 100,
        message: getFriendlyMeshyTaskMessage(task),
        errorMessage: getFriendlyMeshyTaskMessage(task)
      } satisfies GenerationStatusResponse);
    }

    if (status !== "succeeded") {
      return NextResponse.json({
        status,
        progress: task.progress ?? 0,
        message: getFriendlyMeshyTaskMessage(task)
      } satisfies GenerationStatusResponse);
    }

    const asset = await storeMeshyTaskAssets(productId, taskId, task);

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

async function storeMeshyTaskAssets(productId: string, taskId: string, task: MeshyTask): Promise<ModelAsset> {
  const glbUrl = task.model_urls?.glb;

  if (!glbUrl) {
    throw new Error("Meshy did not return a GLB model.");
  }

  const glb = await downloadRemoteAsset(glbUrl, "model/gltf-binary");
  const glbUpload = await uploadR2Object({
    key: createModelAssetKey(productId, taskId, "model.glb"),
    body: glb.body,
    contentType: glb.contentType
  });

  const usdz = task.model_urls?.usdz
    ? await downloadRemoteAsset(task.model_urls.usdz, "model/vnd.usdz+zip")
    : null;
  const usdzUpload = usdz
    ? await uploadR2Object({
        key: createModelAssetKey(productId, taskId, "model.usdz"),
        body: usdz.body,
        contentType: usdz.contentType
      })
    : null;

  const posterSourceUrl = task.thumbnail_urls?.front ?? task.thumbnail_url;
  const poster = posterSourceUrl ? await downloadRemoteAsset(posterSourceUrl, "image/png") : null;
  const posterUpload = poster
    ? await uploadR2Object({
        key: createModelAssetKey(productId, taskId, "poster.png"),
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
    textureMax: 2048,
    dimensionsPresent: true
  };
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

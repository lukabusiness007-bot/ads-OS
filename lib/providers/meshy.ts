import type { GenerationClientStatus } from "@/lib/types";

const MESHY_BASE_URL = "https://api.meshy.ai/openapi/v1";

export type MeshyTaskStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";

export type MeshyTask = {
  id: string;
  type?: "multi-image-to-3d";
  model_urls?: {
    glb?: string;
    usdz?: string;
    fbx?: string;
    obj?: string;
    stl?: string;
    pre_remeshed_glb?: string;
  };
  thumbnail_url?: string;
  thumbnail_urls?: {
    front?: string;
    right?: string;
    back?: string;
    left?: string;
  };
  progress?: number;
  status: MeshyTaskStatus;
  task_error?: {
    type?: string;
    code?: string;
    message?: string;
    doc_url?: string;
  } | null;
  consumed_credits?: number;
};

export class MeshyConfigurationError extends Error {
  constructor() {
    super("Meshy API is not configured.");
    this.name = "MeshyConfigurationError";
  }
}

export class MeshyRequestError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "MeshyRequestError";
    this.statusCode = statusCode;
  }
}

type CreateMeshyMultiImageTaskOptions = {
  imageEnhancement?: boolean;
};

export async function createMeshyMultiImageTask(
  imageDataUris: string[],
  options: CreateMeshyMultiImageTaskOptions = {}
) {
  if (imageDataUris.length !== 4) {
    throw new MeshyRequestError(400, "Meshy generation requires exactly 4 images.");
  }

  const primaryTextureReference = imageDataUris[0];

  const response = await fetch(`${MESHY_BASE_URL}/multi-image-to-3d`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMeshyApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image_urls: imageDataUris,
      ai_model: "latest",
      should_texture: true,
      enable_pbr: true,
      hd_texture: true,
      texture_image_url: primaryTextureReference,
      target_formats: ["glb", "usdz"],
      image_enhancement: options.imageEnhancement ?? false,
      remove_lighting: true,
      auto_size: true,
      origin_at: "bottom"
    })
  });

  if (!response.ok) {
    throw await createMeshyRequestError(response);
  }

  const payload = (await response.json()) as { result?: string };

  if (!payload.result) {
    throw new MeshyRequestError(502, "Meshy did not return a task id.");
  }

  return payload.result;
}

export async function getMeshyMultiImageTask(taskId: string): Promise<MeshyTask> {
  const response = await fetch(`${MESHY_BASE_URL}/multi-image-to-3d/${encodeURIComponent(taskId)}`, {
    headers: {
      Authorization: `Bearer ${getMeshyApiKey()}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw await createMeshyRequestError(response);
  }

  return response.json() as Promise<MeshyTask>;
}

export function mapMeshyStatus(status: MeshyTaskStatus): GenerationClientStatus {
  if (status === "PENDING") {
    return "queued";
  }

  if (status === "IN_PROGRESS") {
    return "running";
  }

  if (status === "SUCCEEDED") {
    return "succeeded";
  }

  return "failed";
}

export function getFriendlyMeshyTaskMessage(task: MeshyTask) {
  if (task.status === "PENDING") {
    return "Your model is queued. We will start as soon as capacity is available.";
  }

  if (task.status === "IN_PROGRESS") {
    return "Your model is being created from the uploaded product photos.";
  }

  if (task.status === "SUCCEEDED") {
    return "Your model is ready and the AR files are being packaged.";
  }

  if (task.task_error?.code === "image_too_complex") {
    return "The photos look too complex for this generation run. Try one clear product on a simple background.";
  }

  if (task.task_error?.type === "invalid_input") {
    return "The uploaded photos need a cleaner input set before generation can continue.";
  }

  return "The generation run could not finish. Please try again with clearer photos.";
}

function getMeshyApiKey() {
  if (!process.env.MESHY_API_KEY) {
    throw new MeshyConfigurationError();
  }

  return process.env.MESHY_API_KEY;
}

async function createMeshyRequestError(response: Response) {
  let message = `Meshy request failed with status ${response.status}.`;

  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    message = payload.message ?? payload.error ?? message;
  } catch {
    const text = await response.text().catch(() => "");
    message = text || message;
  }

  return new MeshyRequestError(response.status, message);
}

import { MAX_GENERATION_PHOTOS, MIN_GENERATION_PHOTOS } from "@/lib/generation-upload";
import type { GenerationClientStatus } from "@/lib/types";

const MESHY_BASE_URL = "https://api.meshy.ai/openapi/v1";

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 5000;

type MeshyFetchRetryOptions = {
  // GET status is idempotent, so transient 5xx responses can be safely retried.
  // POST create is NOT idempotent: a 5xx may mean the task was created but the
  // response was lost, so retrying could double-charge credits. For create, only
  // network errors (request never reached Meshy) and 429 (throttled before
  // processing) are retried.
  retryOn5xx: boolean;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(attempt: number, response?: Response) {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, RETRY_MAX_DELAY_MS);
    }
  }

  const backoff = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
  const jitter = Math.random() * RETRY_BASE_DELAY_MS;
  return Math.min(backoff + jitter, RETRY_MAX_DELAY_MS);
}

async function fetchMeshyWithRetry(
  url: string,
  init: RequestInit,
  options: MeshyFetchRetryOptions
): Promise<Response> {
  let lastNetworkError: unknown;

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, init);

      const isRetryableStatus =
        response.status === 429 || (options.retryOn5xx && response.status >= 500);

      if (response.ok || !isRetryableStatus || attempt === MAX_FETCH_ATTEMPTS) {
        return response;
      }

      await delay(getRetryDelayMs(attempt, response));
    } catch (error) {
      // Network/DNS/timeout failures: the request did not get a response, so it
      // is safe to retry for both GET and POST.
      lastNetworkError = error;

      if (attempt === MAX_FETCH_ATTEMPTS) {
        throw error;
      }

      await delay(getRetryDelayMs(attempt));
    }
  }

  throw lastNetworkError ?? new Error("Meshy request failed after retries.");
}

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

export type MeshyFailureDetails = {
  code: string;
  message: string;
  retryable: boolean;
};

type CreateMeshyMultiImageTaskOptions = {
  imageEnhancement?: boolean;
};

export async function createMeshyMultiImageTask(
  imageUrls: string[],
  options: CreateMeshyMultiImageTaskOptions = {}
) {
  if (imageUrls.length < MIN_GENERATION_PHOTOS || imageUrls.length > MAX_GENERATION_PHOTOS) {
    throw new MeshyRequestError(
      400,
      `Meshy generation requires exactly ${MAX_GENERATION_PHOTOS} images.`
    );
  }

  const primaryTextureReference = imageUrls[0];

  const response = await fetchMeshyWithRetry(`${MESHY_BASE_URL}/multi-image-to-3d`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMeshyApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image_urls: imageUrls,
      ai_model: "latest",
      should_texture: true,
      // PBR is intentionally off: Meshy auto-assigns metalness to non-metal
      // surfaces (fabric, plastic), which mirror environment light and wash the
      // model out to white. should_texture alone bakes a full-color albedo that
      // renders correctly under the viewer's neutral lighting.
      enable_pbr: false,
      texture_image_url: primaryTextureReference,
      target_formats: ["glb", "usdz"],
      image_enhancement: options.imageEnhancement ?? false,
      auto_size: true,
      origin_at: "bottom"
    })
  }, { retryOn5xx: false });

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
  const response = await fetchMeshyWithRetry(`${MESHY_BASE_URL}/multi-image-to-3d/${encodeURIComponent(taskId)}`, {
    headers: {
      Authorization: `Bearer ${getMeshyApiKey()}`
    },
    cache: "no-store"
  }, { retryOn5xx: true });

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

  return getMeshyTaskFailureDetails(task).message;
}

export function getMeshyTaskFailureDetails(task: MeshyTask): MeshyFailureDetails {
  const code = task.task_error?.code ?? task.task_error?.type ?? task.status.toLowerCase();
  const type = task.task_error?.type;
  const rawMessage = task.task_error?.message?.toLowerCase() ?? "";

  if (task.status === "CANCELED") {
    return {
      code: "canceled",
      message: "This generation run was canceled before the model finished.",
      retryable: true
    };
  }

  if (code === "image_too_complex") {
    return {
      code,
      message: "The photos look too complex for this generation run. Use one clear product on a simple background, without extra objects or dense repeating details.",
      retryable: false
    };
  }

  if (code === "moderation_blocked") {
    return {
      code,
      message: "The photos were blocked by the generation safety filter. Use neutral product-only photos and try again.",
      retryable: false
    };
  }

  if (code === "timeout" || type === "timeout") {
    return {
      code: "timeout",
      message: "The generation run timed out. Try again; if it repeats, simplify the photo set and keep one product centered in each image.",
      retryable: true
    };
  }

  if (code === "service_unavailable" || type === "service_unavailable" || code === "server_error" || type === "server_error") {
    return {
      code,
      message: "The generation service hit a temporary processing error. Try the same photo set again in a few minutes.",
      retryable: true
    };
  }

  if (code === "format_conversion_failed") {
    return {
      code,
      message: "The model was created, but the AR file conversion failed. Try generating again so the web and AR files can be packaged.",
      retryable: true
    };
  }

  if (type === "invalid_input" || code === "invalid_input") {
    const message = rawMessage.includes("download") || rawMessage.includes("url") || rawMessage.includes("fetch")
      ? "The generation service could not read one or more uploaded photos. Start a new generation; new jobs keep private photo links available longer while they wait in the queue."
      : "The uploaded photos need a cleaner input set before generation can continue. Use four sharp JPG or PNG views of the same single product.";

    return {
      code,
      message,
      retryable: false
    };
  }

  return {
    code,
    message: "The generation run could not finish. Try again with four clearer product-only photos.",
    retryable: true
  };
}

export function getFriendlyMeshyRequestErrorMessage(error: MeshyRequestError) {
  if (error.statusCode === 401 || error.statusCode === 403) {
    return "The generation service rejected the API key. Check the server API key configuration before trying again.";
  }

  if (error.statusCode === 402) {
    return "The generation service account does not have enough credits to start this model.";
  }

  if (error.statusCode === 429) {
    return "The generation service is rate limiting new jobs. Wait a minute and try again.";
  }

  if (error.statusCode === 400) {
    const rawMessage = error.message.toLowerCase();

    if (rawMessage.includes("download") || rawMessage.includes("url") || rawMessage.includes("accessible")) {
      return "The generation service could not read the uploaded photo links. Start a new generation so fresh private photo links can be sent.";
    }

    return "The generation service rejected the photo request. Use four valid JPG or PNG product photos and try again.";
  }

  if (error.statusCode >= 500) {
    return "The generation service is having a temporary issue. Try again in a few minutes.";
  }

  return "The generation service could not start this model. Try again with four clearer product photos.";
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

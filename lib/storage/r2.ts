import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  bucket: string;
  publicBaseUrl: string;
  client: S3Client;
};

export class R2ConfigurationError extends Error {
  constructor(message = "R2 storage is not configured.") {
    super(message);
    this.name = "R2ConfigurationError";
  }
}

export class R2RequestError extends Error {
  operation: string;

  constructor(operation: string, cause: unknown) {
    super(`R2 request failed while ${operation}.`);
    this.name = "R2RequestError";
    this.operation = operation;
    this.cause = cause;
  }
}

export type R2UploadResult = {
  key: string;
  url: string;
};

export type R2UploadInput = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
};

export type R2PresignedPutInput = {
  key: string;
  contentType: string;
  cacheControl?: string;
  expiresIn?: number;
};

let cachedConfig: R2Config | null = null;

export const DEMO_ORG_ID = "demo-org";

export async function uploadR2Object({
  key,
  body,
  contentType,
  cacheControl = "public, max-age=31536000, immutable"
}: R2UploadInput): Promise<R2UploadResult> {
  const config = getR2Config();

  try {
    await config.client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl
      })
    );
  } catch (error) {
    throw new R2RequestError("uploading an object", error);
  }

  return {
    key,
    url: createPublicR2Url(config.publicBaseUrl, key)
  };
}

export async function createPresignedR2PutUrl({
  key,
  contentType,
  cacheControl = "private, max-age=0, no-store",
  expiresIn = 15 * 60
}: R2PresignedPutInput) {
  const config = getR2Config();
  let uploadUrl: string;

  try {
    uploadUrl = await getSignedUrl(
      config.client,
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: cacheControl
      }),
      { expiresIn }
    );
  } catch (error) {
    throw new R2RequestError("creating a signed upload URL", error);
  }

  return {
    key,
    uploadUrl,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl
    }
  };
}

export async function createPresignedR2GetUrl(key: string, expiresIn = 15 * 60) {
  const config = getR2Config();

  try {
    return await getSignedUrl(
      config.client,
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key
      }),
      { expiresIn }
    );
  } catch (error) {
    throw new R2RequestError("creating a signed download URL", error);
  }
}

export function createProductPhotoKey(productId: string, fileName: string, index: number) {
  return `product-photos/${DEMO_ORG_ID}/${productId}/${String(index + 1).padStart(2, "0")}-${sanitizeObjectKeyPart(fileName)}`;
}

export function createOrganizationProductPhotoKey(organizationId: string, productId: string, fileName: string, index: number) {
  return `product-photos/${sanitizeObjectKeyPart(organizationId)}/${sanitizeObjectKeyPart(productId)}/${String(index + 1).padStart(2, "0")}-${sanitizeObjectKeyPart(fileName)}`;
}

export function createModelAssetKey(productId: string, taskId: string, fileName: string) {
  return `model-assets/${DEMO_ORG_ID}/${productId}/${taskId}/${fileName}`;
}

export function createOrganizationModelAssetKey(
  organizationId: string,
  productId: string,
  taskId: string,
  fileName: string
) {
  return `model-assets/${sanitizeObjectKeyPart(organizationId)}/${sanitizeObjectKeyPart(productId)}/${sanitizeObjectKeyPart(taskId)}/${sanitizeObjectKeyPart(fileName)}`;
}

function getR2Config(): R2Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const endpoint = process.env.R2_ENDPOINT ?? getCloudflareR2Endpoint(process.env.R2_ACCOUNT_ID);
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw new R2ConfigurationError();
  }

  // The S3 API endpoint (<account>.r2.cloudflarestorage.com) requires SigV4 auth
  // and serves no CORS headers, so objects behind it are unfetchable from a
  // browser. R2_PUBLIC_BASE_URL must be the bucket's public domain (the managed
  // pub-<hash>.r2.dev URL or a custom domain). Catch this misconfiguration here
  // rather than silently persisting dead public_glb_url values.
  if (/\.r2\.cloudflarestorage\.com/i.test(publicBaseUrl)) {
    throw new R2ConfigurationError(
      "R2_PUBLIC_BASE_URL points at the S3 API endpoint (r2.cloudflarestorage.com), " +
        "which is not publicly fetchable. Set it to the bucket's public domain " +
        "(e.g. https://pub-<hash>.r2.dev or a custom domain)."
    );
  }

  cachedConfig = {
    bucket,
    publicBaseUrl,
    client: new S3Client({
      endpoint,
      region: "auto",
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      // Recent AWS SDK v3 adds a CRC32 checksum (computed at signing time over an
      // empty body) into presigned PUT URLs, which breaks browser uploads to R2:
      // the actual file body fails the baked-in checksum. Only add checksums when
      // the operation strictly requires them so presigned URLs stay clean.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED"
    })
  };

  return cachedConfig;
}

function getCloudflareR2Endpoint(accountId: string | undefined) {
  if (!accountId) {
    return undefined;
  }

  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function publicUrlForKey(key: string): string | null {
  try {
    return createPublicR2Url(getR2Config().publicBaseUrl, key);
  } catch {
    return null;
  }
}

function createPublicR2Url(publicBaseUrl: string, key: string) {
  const base = publicBaseUrl.replace(/\/+$/, "");
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${base}/${encodedKey}`;
}

function sanitizeObjectKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "upload";
}

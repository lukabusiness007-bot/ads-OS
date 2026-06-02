import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  bucket: string;
  publicBaseUrl: string;
  client: S3Client;
};

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

  await config.client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl
    })
  );

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
  const uploadUrl = await getSignedUrl(
    config.client,
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl
    }),
    { expiresIn }
  );

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

  return getSignedUrl(
    config.client,
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key
    }),
    { expiresIn }
  );
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
    throw new Error("R2 storage is not configured.");
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
      }
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

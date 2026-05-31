export const MAX_GENERATION_PHOTOS = 4;
export const REQUIRED_GENERATION_PHOTOS = 4;
export const MAX_GENERATION_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_GENERATION_PHOTO_BYTES_TOTAL =
  MAX_GENERATION_PHOTOS * MAX_GENERATION_PHOTO_SIZE_BYTES;
export const MAX_GENERATION_FORM_BODY_SIZE_BYTES = 96 * 1024 * 1024;

export const SUPPORTED_GENERATION_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

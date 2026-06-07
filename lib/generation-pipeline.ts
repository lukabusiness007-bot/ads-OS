import { MAX_GENERATION_PHOTOS, MIN_GENERATION_PHOTOS } from "./generation-upload";
import type {
  ModelAsset,
  ModelPackageCheck,
  PhotoAngle,
  PhotoSet,
  PreflightCheck
} from "./types";

export const requiredPhotoAngles: PhotoAngle[] = [
  "front",
  "back",
  "left",
  "right",
  "top_angle",
  "material_detail",
  "scale_context",
  "extra_angle"
];

export const photoAngleLabels: Record<PhotoAngle, string> = {
  front: "Front",
  back: "Back",
  left: "Left",
  right: "Right",
  top_angle: "Top angle",
  material_detail: "Material detail",
  scale_context: "Scale/context",
  extra_angle: "Extra angle"
};

export const pipelineStages = [
  "Photos uploaded",
  "Preflight checks",
  "3D generation",
  "AR asset packaging",
  "Model preview",
  "Quality review"
];

export function runPhotoPreflight(photoSet: PhotoSet): PreflightCheck[] {
  const requiredAngleSet = new Set(photoSet.requiredAngles);
  const uploadedAngleSet = new Set(photoSet.photos.map((photo) => photo.angle));
  const missingAngles = [...requiredAngleSet].filter((angle) => !uploadedAngleSet.has(angle));
  const unsupportedFiles = photoSet.photos.filter((photo) => !["image/jpeg", "image/png"].includes(photo.fileType));
  const tinyImages = photoSet.photos.filter((photo) => photo.width < 1200 || photo.height < 1200);
  const blurryImages = photoSet.photos.filter((photo) => photo.blurScore < 0.64);
  const duplicateImages = photoSet.photos.filter((photo) => photo.duplicateGroup);

  return [
    {
      id: "photo-count",
      label: "Photo count",
      status:
        photoSet.photos.length >= MIN_GENERATION_PHOTOS && photoSet.photos.length <= MAX_GENERATION_PHOTOS
          ? "pass"
          : "fail",
      detail: `${photoSet.photos.length} photos uploaded; the HD Meshy flow needs exactly ${MAX_GENERATION_PHOTOS}.`
    },
    {
      id: "file-types",
      label: "File types",
      status: unsupportedFiles.length === 0 ? "pass" : "fail",
      detail:
        unsupportedFiles.length === 0
          ? "All files are JPG or PNG."
          : `${unsupportedFiles.length} unsupported file needs replacement.`
    },
    {
      id: "image-size",
      label: "Image size",
      status: tinyImages.length === 0 ? "pass" : "warning",
      detail:
        tinyImages.length === 0
          ? "All images meet the 1200px minimum edge target."
          : `${tinyImages.length} image should be recaptured at higher resolution.`
    },
    {
      id: "blur",
      label: "Blur detection",
      status: blurryImages.length === 0 ? "pass" : "warning",
      detail:
        blurryImages.length === 0
          ? "No likely blurry images detected."
          : `${blurryImages.length} image may be too soft for reliable geometry.`
    },
    {
      id: "duplicates",
      label: "Duplicate detection",
      status: duplicateImages.length === 0 ? "pass" : "warning",
      detail:
        duplicateImages.length === 0
          ? "No duplicate captures detected."
          : `${duplicateImages.length} image appears visually duplicated.`
    },
    {
      id: "required-angles",
      label: "Required angles",
      status: missingAngles.length === 0 ? "pass" : "warning",
      detail:
        missingAngles.length === 0
          ? "All required product angles are represented."
          : `Missing ${missingAngles.map((angle) => photoAngleLabels[angle]).join(", ")}.`
    }
  ];
}

export function canStartGeneration(checks: PreflightCheck[]) {
  return checks.every((check) => check.status !== "fail");
}

export function runModelPackageChecks(asset: ModelAsset): ModelPackageCheck[] {
  return [
    {
      id: "model-load",
      label: "Model loads",
      status: asset.glbUrl ? "pass" : "fail",
      detail: asset.glbUrl ? "GLB asset URL is present for web preview." : "Missing GLB asset URL."
    },
    {
      id: "file-size",
      label: "File size",
      status: asset.fileSizeMb <= 10 ? "pass" : "warning",
      detail: `${asset.fileSizeMb} MB package; target is under 10 MB.`
    },
    {
      id: "dimensions",
      label: "Dimensions metadata",
      status: asset.dimensionsPresent === false ? "warning" : "pass",
      detail:
        asset.dimensionsPresent === false
          ? "Dimensions metadata needs reviewer confirmation."
          : "Dimensions metadata is present."
    },
    {
      id: "textures",
      label: "Texture files",
      status: asset.textureMax >= 4096 ? "pass" : "warning",
      detail: `${asset.textureMax}px max texture; HD target is 4096px.`
    },
    {
      id: "public-preview",
      label: "Public preview render",
      status: asset.posterUrl ? "pass" : "fail",
      detail: asset.posterUrl ? "Poster image is ready before model load." : "Poster image is missing."
    },
    {
      id: "ios-ar",
      label: "iOS AR package",
      status: asset.usdzUrl ? "pass" : "warning",
      detail: asset.usdzUrl ? "USDZ is ready for Quick Look." : "Hide iOS AR until USDZ is generated."
    }
  ];
}

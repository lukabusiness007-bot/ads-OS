"use client"

import {
  MAX_GENERATION_PHOTO_SIZE_BYTES,
  SUPPORTED_GENERATION_IMAGE_TYPES,
  TARGET_GENERATION_PHOTO_SIZE_BYTES
} from "@/lib/generation-upload";

const DEFAULT_MAX_DIMENSION = 4096;
const DEFAULT_QUALITY = 0.86;
const MIN_QUALITY = 0.62;
const MIN_DIMENSION = 1200;
const BYTES_PER_MEGABYTE = 1024 * 1024;

export type PreparedGenerationPhoto = {
  file: File;
  originalName: string;
  originalSize: number;
  preparedSize: number;
  width?: number;
  height?: number;
  wasOptimized: boolean;
};

export type PrepareGenerationPhotosOptions = {
  maxDimension?: number;
  targetBytes?: number;
  quality?: number;
  onProgress?: (progress: { completed: number; total: number; currentFileName: string }) => void;
};

type ImageSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
};

export async function prepareGenerationPhotos(
  files: File[],
  options: PrepareGenerationPhotosOptions = {}
): Promise<PreparedGenerationPhoto[]> {
  const prepared: PreparedGenerationPhoto[] = [];
  const total = files.length;

  for (const [index, file] of files.entries()) {
    options.onProgress?.({ completed: index, total, currentFileName: file.name });
    prepared.push(await prepareGenerationPhoto(file, options));
    options.onProgress?.({ completed: index + 1, total, currentFileName: file.name });
  }

  return prepared;
}

async function prepareGenerationPhoto(file: File, options: PrepareGenerationPhotosOptions) {
  const targetBytes = Math.min(options.targetBytes ?? TARGET_GENERATION_PHOTO_SIZE_BYTES, MAX_GENERATION_PHOTO_SIZE_BYTES);
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;

  if (file.size <= targetBytes && isSupportedPhoto(file)) {
    const dimensions = await readImageDimensions(file).catch(() => null);

    return {
      file,
      originalName: file.name,
      originalSize: file.size,
      preparedSize: file.size,
      width: dimensions?.width,
      height: dimensions?.height,
      wasOptimized: false
    };
  }

  const image = await loadImageSource(file);

  try {
    const startingDimensionLimit = file.size > 80 * BYTES_PER_MEGABYTE ? 3000 : maxDimension;
    let dimensionLimit = startingDimensionLimit;
    let bestBlob: Blob | null = null;
    let bestWidth = image.width;
    let bestHeight = image.height;

    while (dimensionLimit >= MIN_DIMENSION) {
      const size = getContainedSize(image.width, image.height, dimensionLimit);
      const canvas = drawImageToCanvas(image.source, size.width, size.height);
      const qualitySteps = buildQualitySteps(options.quality ?? DEFAULT_QUALITY);

      for (const quality of qualitySteps) {
        const blob = await canvasToBlob(canvas, quality);
        bestBlob = blob;
        bestWidth = size.width;
        bestHeight = size.height;

        if (blob.size <= targetBytes) {
          return buildPreparedPhoto(file, blob, bestWidth, bestHeight);
        }
      }

      dimensionLimit = Math.floor(dimensionLimit * 0.82);
    }

    if (!bestBlob) {
      throw new Error(`We could not prepare ${file.name} for upload.`);
    }

    return buildPreparedPhoto(file, bestBlob, bestWidth, bestHeight);
  } finally {
    image.close?.();
  }
}

function isSupportedPhoto(file: File) {
  if (SUPPORTED_GENERATION_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return true;
  }

  const fileName = file.name.toLowerCase();

  return fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png");
}

async function readImageDimensions(file: File) {
  const image = await loadImageSource(file);

  try {
    return {
      width: image.width,
      height: image.height
    };
  } finally {
    image.close?.();
  }
}

async function loadImageSource(file: File): Promise<ImageSource> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close()
    };
  }

  return loadHtmlImage(file);
}

function loadHtmlImage(file: File): Promise<ImageSource> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`We could not read ${file.name}.`));
    };

    image.src = objectUrl;
  });
}

function getContainedSize(width: number, height: number, maxDimension: number) {
  const longestSide = Math.max(width, height);

  if (longestSide <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / longestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function drawImageToCanvas(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not prepare the selected photos.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return canvas;
}

function buildQualitySteps(startQuality: number) {
  const steps: number[] = [];

  for (let quality = startQuality; quality >= MIN_QUALITY; quality -= 0.06) {
    steps.push(Number(quality.toFixed(2)));
  }

  if (!steps.includes(MIN_QUALITY)) {
    steps.push(MIN_QUALITY);
  }

  return steps;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Your browser could not prepare the selected photos."));
      },
      "image/jpeg",
      quality
    );
  });
}

function buildPreparedPhoto(file: File, blob: Blob, width: number, height: number): PreparedGenerationPhoto {
  const preparedFile = new File([blob], getPreparedFileName(file.name), {
    type: "image/jpeg",
    lastModified: file.lastModified
  });

  return {
    file: preparedFile,
    originalName: file.name,
    originalSize: file.size,
    preparedSize: preparedFile.size,
    width,
    height,
    wasOptimized: preparedFile.size !== file.size || preparedFile.name !== file.name
  };
}

function getPreparedFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName || "photo"}.jpg`;
}

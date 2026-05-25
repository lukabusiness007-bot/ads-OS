import type { ProductStatus } from "./types";

export function statusLabel(status: ProductStatus) {
  if (status === "photos_uploaded") {
    return "Photos needed";
  }

  if (status === "awaiting_review") {
    return "Needs review";
  }

  if (status === "generation_failed") {
    return "Needs revision";
  }

  return toTitleCase(status.replaceAll("_", " "));
}

export function statusTone(status: ProductStatus) {
  if (status === "approved" || status === "published") {
    return "success";
  }

  if (status === "rejected" || status === "generation_failed") {
    return "danger";
  }

  if (status === "generating" || status === "awaiting_review") {
    return "warning";
  }

  return "neutral";
}

export function formatMeters(value: number) {
  return `${Math.round(value * 100)} cm`;
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

import { createHash } from "node:crypto";
import type { Document, Transform } from "@gltf-transform/core";

/**
 * Plan 2 Part C — watermarking & traceability.
 *
 * Two layers are stamped into the SERVED model.glb during the optimize pass (the
 * private model-source.glb stays clean for the paid buyout export):
 *
 *  1. Metadata extras + asset.copyright — org/product/license/timestamp. Cheap,
 *     human-readable, and trivially strippable: a baseline marker only.
 *  2. A per-org vertex-position fingerprint — an imperceptible, deterministic
 *     position jitter that survives metadata stripping, Draco compression, and
 *     re-export. This is the enforceable evidence: a leaked file can be
 *     correlated back to the org that was licensed to display it.
 */

export type GlbWatermark = {
  organizationId: string;
  productId?: string;
  taskId?: string;
  /** Human-readable license note baked into asset.copyright + extras. */
  licenseTerms?: string;
  /** ISO timestamp; defaults to now. */
  issuedAt?: string;
};

export const DEFAULT_LICENSE_TERMS =
  "Licensed for display via Augmenta delivery only. Not licensed for redistribution or resale.";

export const FINGERPRINT_VERSION = "vertex-jitter-v1";

/**
 * Fingerprint amplitude as a fraction of the model's bounding-box diagonal.
 * ~2.5e-4 → ~0.25 mm on a 1 m product: below the perceptible threshold, yet
 * several Draco 14-bit quantization steps wide, so it survives compression and
 * re-export rather than being rounded away.
 */
const FINGERPRINT_AMPLITUDE = 2.5e-4;

function seedFrom(...parts: Array<string | number>): number {
  return createHash("sha256").update(parts.join(":")).digest().readUInt32LE(0);
}

/** Small, fast, fully deterministic PRNG so the jitter is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Imperceptible, per-org vertex-position fingerprint. Insert AFTER weld and
 * BEFORE draco so the jitter is welded into the served geometry and then
 * preserved through quantization. Only POSITION is perturbed (never normals or
 * UVs), so shading and texturing are unaffected; topology is untouched, so the
 * model stays watertight.
 */
export function vertexFingerprintTransform(organizationId: string): Transform {
  return (document: Document) => {
    const seenAccessors = new Set<unknown>();
    let accessorIndex = 0;

    for (const mesh of document.getRoot().listMeshes()) {
      for (const primitive of mesh.listPrimitives()) {
        const position = primitive.getAttribute("POSITION");
        if (!position || seenAccessors.has(position)) continue;
        seenAccessors.add(position);

        const array = position.getArray();
        if (!array) continue;

        const min = position.getMin([]);
        const max = position.getMax([]);
        const diag = Math.hypot(
          (max[0] ?? 0) - (min[0] ?? 0),
          (max[1] ?? 0) - (min[1] ?? 0),
          (max[2] ?? 0) - (min[2] ?? 0)
        );
        const amplitude = (diag || 1) * FINGERPRINT_AMPLITUDE;

        const rand = mulberry32(seedFrom(organizationId, accessorIndex));
        const count = position.getCount();
        const next = array.slice();
        for (let i = 0; i < count; i++) {
          next[i * 3] = array[i * 3] + (rand() * 2 - 1) * amplitude;
          next[i * 3 + 1] = array[i * 3 + 1] + (rand() * 2 - 1) * amplitude;
          next[i * 3 + 2] = array[i * 3 + 2] + (rand() * 2 - 1) * amplitude;
        }
        position.setArray(next);
        accessorIndex++;
      }
    }
  };
}

/** Stamp the human-readable copyright + structured extras marker. */
export function stampWatermarkMetadata(document: Document, watermark: GlbWatermark): void {
  const root = document.getRoot();
  const issuedAt = watermark.issuedAt ?? new Date().toISOString();
  const license = watermark.licenseTerms ?? DEFAULT_LICENSE_TERMS;

  root.getAsset().copyright = `© Augmenta. ${license} Issued ${issuedAt}.`;

  root.setExtras({
    ...root.getExtras(),
    augmenta: {
      v: 1,
      org: watermark.organizationId,
      product: watermark.productId ?? null,
      task: watermark.taskId ?? null,
      license,
      issuedAt,
      fingerprint: FINGERPRINT_VERSION
    }
  });
}

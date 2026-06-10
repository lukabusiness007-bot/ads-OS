import { NodeIO } from "@gltf-transform/core";
import { EXTTextureWebP, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

export type ProductDimensions = {
  width?: number | null;
  height?: number | null;
  depth?: number | null;
};

export type ScaledGlb = {
  buffer: Buffer;
  appliedScale: number;
};

// Sanity bounds for merchant-entered dimensions (meters). Anything outside this
// range is almost certainly a data-entry mistake (e.g. cm typed into a meters
// field) and should not be used to rescale a model.
const MIN_DIMENSION_M = 0.01;
const MAX_DIMENSION_M = 10;

// Below this, the model's bounding box is considered degenerate (point/empty
// geometry) and a scale factor cannot be derived from it.
const MIN_BOUNDS_SIZE = 1e-6;

/**
 * Rescales a GLB so its bounding box matches the merchant-provided real-world
 * dimensions (meters). glTF/USD AR viewers treat 1 unit = 1 meter, so models
 * that come back from generation pre-normalized to an arbitrary unit size
 * render too small/large in Quick Look and Scene Viewer without this.
 *
 * Returns null when no usable dimensions are provided or the model's bounds
 * are degenerate, leaving the input untouched.
 */
export async function scaleGlbToDimensions(
  input: Buffer,
  dimensions: ProductDimensions
): Promise<ScaledGlb | null> {
  const io = new NodeIO()
    .registerExtensions([EXTTextureWebP, KHRDracoMeshCompression])
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule()
    });

  const document = await io.readBinary(input);
  const scenes = document.getRoot().listScenes();

  if (scenes.length === 0) {
    return null;
  }

  const scene = document.getRoot().getDefaultScene() ?? scenes[0];
  const bounds = getBounds(scene);
  const size: [number, number, number] = [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2]
  ];

  // glTF axis convention: X = width, Y = height, Z = depth.
  const targets: Array<number | null | undefined> = [dimensions.width, dimensions.height, dimensions.depth];

  const ratios: number[] = [];
  for (let axis = 0; axis < 3; axis++) {
    const target = targets[axis];
    if (typeof target !== "number" || !Number.isFinite(target)) continue;
    if (target < MIN_DIMENSION_M || target > MAX_DIMENSION_M) continue;
    if (size[axis] <= MIN_BOUNDS_SIZE) continue;

    ratios.push(target / size[axis]);
  }

  if (ratios.length === 0) {
    return null;
  }

  ratios.sort((a, b) => a - b);
  const scaleFactor = ratios[Math.floor(ratios.length / 2)];

  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    return null;
  }

  const minRatio = ratios[0];
  const maxRatio = ratios[ratios.length - 1];
  if (ratios.length > 1 && (maxRatio - minRatio) / minRatio > 0.15) {
    console.warn("Model proportions diverge from provided dimensions by more than 15%", {
      ratios
    });
  }

  for (const node of scene.listChildren()) {
    const [x, y, z] = node.getScale();
    node.setScale([x * scaleFactor, y * scaleFactor, z * scaleFactor]);
  }

  const buffer = Buffer.from(await io.writeBinary(document));

  return { buffer, appliedScale: scaleFactor };
}

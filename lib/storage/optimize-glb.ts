import { NodeIO, Primitive, type Document } from "@gltf-transform/core";
import { EXTTextureWebP, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { dedup, draco, prune, textureCompress, weld } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";

export type OptimizedGlb = {
  buffer: Buffer;
  triangleCount: number;
  textureMax: number;
  fileSizeMb: number;
};

export async function optimizeGlb(input: Buffer): Promise<OptimizedGlb | null> {
  try {
    const io = new NodeIO()
      .registerExtensions([EXTTextureWebP, KHRDracoMeshCompression])
      .registerDependencies({
        "draco3d.decoder": await draco3d.createDecoderModule(),
        "draco3d.encoder": await draco3d.createEncoderModule()
      });

    const document = await io.readBinary(input);

    await document.transform(
      dedup(),
      prune(),
      weld(),
      draco({
        quantizePosition: 14,
        quantizeNormal: 10,
        quantizeTexcoord: 12
      }),
      textureCompress({
        encoder: sharp,
        targetFormat: "webp",
        quality: 85
        // resize: [2048, 2048]
      })
    );

    const output = Buffer.from(await io.writeBinary(document));

    if (output.length >= input.length) {
      console.info("GLB optimization skipped because the optimized payload was not smaller", {
        originalBytes: input.length,
        optimizedBytes: output.length
      });
      return null;
    }

    return {
      buffer: output,
      triangleCount: getTriangleCount(document),
      textureMax: getTextureMax(document),
      fileSizeMb: bytesToMb(output.length)
    };
  } catch (error) {
    console.warn("GLB optimization failed; falling back to raw Meshy model", toSafeOptimizationError(error));
    return null;
  }
}

export function getGlbMetadata(input: Buffer): Promise<Omit<OptimizedGlb, "buffer">> {
  return readGlbMetadata(input);
}

async function readGlbMetadata(input: Buffer) {
  try {
    const io = new NodeIO()
      .registerExtensions([EXTTextureWebP, KHRDracoMeshCompression])
      .registerDependencies({
        "draco3d.decoder": await draco3d.createDecoderModule()
      });
    const document = await io.readBinary(input);

    return {
      triangleCount: getTriangleCount(document),
      textureMax: getTextureMax(document),
      fileSizeMb: bytesToMb(input.length)
    };
  } catch {
    return {
      triangleCount: 0,
      textureMax: 4096,
      fileSizeMb: bytesToMb(input.length)
    };
  }
}

function getTriangleCount(document: Document) {
  let triangleCount = 0;

  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const drawCount = primitive.getIndices()?.getCount() ?? primitive.getAttribute("POSITION")?.getCount() ?? 0;

      switch (primitive.getMode()) {
        case Primitive.Mode.TRIANGLES:
          triangleCount += Math.floor(drawCount / 3);
          break;
        case Primitive.Mode.TRIANGLE_STRIP:
        case Primitive.Mode.TRIANGLE_FAN:
          triangleCount += Math.max(0, drawCount - 2);
          break;
      }
    }
  }

  return triangleCount;
}

function getTextureMax(document: Document) {
  let textureMax = 0;

  for (const texture of document.getRoot().listTextures()) {
    const size = texture.getSize();

    if (size) {
      textureMax = Math.max(textureMax, size[0], size[1]);
    }
  }

  return textureMax || 4096;
}

function bytesToMb(bytes: number) {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

function toSafeOptimizationError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return { message: String(error) };
}

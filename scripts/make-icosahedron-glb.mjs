#!/usr/bin/env node
/**
 * Generates a flat-shaded emerald-glass icosahedron as a valid binary .glb
 * No external dependencies — pure Node.js ESM.
 * Run: node scripts/make-icosahedron-glb.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'models', 'veridian-icosahedron.glb');

// ── Geometry ─────────────────────────────────────────────────────────────────

const phi = (1 + Math.sqrt(5)) / 2;

// 12 icosahedron base vertices, normalized to unit sphere
const rawLen = Math.hypot(0, 1, phi);
const V = [
  [ 0,  1,  phi], [ 0, -1,  phi], [ 0,  1, -phi], [ 0, -1, -phi],
  [ 1,  phi,  0], [-1,  phi,  0], [ 1, -phi,  0], [-1, -phi,  0],
  [ phi,  0,  1], [-phi,  0,  1], [ phi,  0, -1], [-phi,  0, -1],
].map(v => v.map(c => c / rawLen));

// 20 triangular faces — CCW winding for outward normals
// (verified: all face normals point away from origin)
const F = [
  // top cap (5 faces around v0)
  [0,1,8],[0,8,4],[0,4,5],[0,5,9],[0,9,1],
  // upper equatorial band
  [1,6,8],[8,6,10],[8,10,4],[4,10,2],[4,2,5],
  // lower equatorial band
  [5,2,11],[5,11,9],[9,11,7],[9,7,1],[1,7,6],
  // bottom cap (5 faces around v3)
  [3,10,6],[3,2,10],[3,11,2],[3,7,11],[3,6,7],
];

// Flat-shaded: each face gets 3 unique vertices with the face normal → 60 verts
const VERT_COUNT = 60; // 20 * 3
const positions = new Float32Array(VERT_COUNT * 3);
const normals   = new Float32Array(VERT_COUNT * 3);

let minX=Infinity, minY=Infinity, minZ=Infinity;
let maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity;

F.forEach((face, fi) => {
  const [a, b, c] = face.map(i => V[i]);

  // Face normal via cross product (e1 × e2)
  const e1 = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
  const e2 = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
  const nx = e1[1]*e2[2] - e1[2]*e2[1];
  const ny = e1[2]*e2[0] - e1[0]*e2[2];
  const nz = e1[0]*e2[1] - e1[1]*e2[0];
  const nl = Math.hypot(nx, ny, nz);

  [a, b, c].forEach((v, vi) => {
    const idx = (fi * 3 + vi) * 3;
    positions[idx]   = v[0]; positions[idx+1] = v[1]; positions[idx+2] = v[2];
    normals[idx]     = nx/nl; normals[idx+1]   = ny/nl; normals[idx+2]   = nz/nl;
    if (v[0] < minX) minX = v[0]; if (v[0] > maxX) maxX = v[0];
    if (v[1] < minY) minY = v[1]; if (v[1] > maxY) maxY = v[1];
    if (v[2] < minZ) minZ = v[2]; if (v[2] > maxZ) maxZ = v[2];
  });
});

// ── glTF JSON ────────────────────────────────────────────────────────────────

// Emerald #1f6f5b — sRGB normalized (model-viewer tone-maps from here)
const ER = 0x1f / 255; // 0.122
const EG = 0x6f / 255; // 0.435
const EB = 0x5b / 255; // 0.357

const BIN_BYTE_LEN = VERT_COUNT * 3 * 4 * 2; // positions + normals, Float32

const gltf = {
  asset: { version: '2.0', generator: 'Veridian icosahedron script v1' },
  extensionsUsed: ['KHR_materials_transmission', 'KHR_materials_ior', 'KHR_materials_volume'],
  scene: 0,
  scenes: [{ name: 'Scene', nodes: [0] }],
  nodes: [{ name: 'EmeraldIcosahedron', mesh: 0 }],
  meshes: [{
    name: 'Icosahedron',
    primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, mode: 4, material: 0 }]
  }],
  materials: [{
    name: 'EmeraldGlass',
    pbrMetallicRoughness: {
      baseColorFactor: [ER, EG, EB, 1.0],
      metallicFactor: 0.0,
      roughnessFactor: 0.05,
    },
    alphaMode: 'BLEND',
    doubleSided: true,
    extensions: {
      KHR_materials_transmission: { transmissionFactor: 0.95 },
      KHR_materials_ior: { ior: 1.5 },
      KHR_materials_volume: {
        thicknessFactor: 1.0,
        attenuationColor: [0.0, 0.62, 0.42],
        attenuationDistance: 0.4
      }
    }
  }],
  accessors: [
    {
      bufferView: 0, byteOffset: 0,
      componentType: 5126, count: VERT_COUNT, type: 'VEC3',
      min: [minX, minY, minZ], max: [maxX, maxY, maxZ]
    },
    {
      bufferView: 1, byteOffset: 0,
      componentType: 5126, count: VERT_COUNT, type: 'VEC3'
    }
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0,               byteLength: VERT_COUNT*3*4, target: 34962 },
    { buffer: 0, byteOffset: VERT_COUNT*3*4,  byteLength: VERT_COUNT*3*4, target: 34962 }
  ],
  buffers: [{ byteLength: BIN_BYTE_LEN }]
};

// ── Binary GLB packer ────────────────────────────────────────────────────────

function padTo4(n) { return Math.ceil(n / 4) * 4; }

const jsonBytes     = Buffer.from(JSON.stringify(gltf), 'utf8');
const jsonPaddedLen = padTo4(jsonBytes.length);

const binData       = Buffer.concat([Buffer.from(positions.buffer), Buffer.from(normals.buffer)]);
const binPaddedLen  = padTo4(binData.length);

const totalLen = 12 + (8 + jsonPaddedLen) + (8 + binPaddedLen);
const glb = Buffer.alloc(totalLen);
let off = 0;

// Header
glb.writeUInt32LE(0x46546C67, off); off += 4; // magic "glTF"
glb.writeUInt32LE(2,           off); off += 4; // version 2
glb.writeUInt32LE(totalLen,    off); off += 4; // total file length

// JSON chunk
glb.writeUInt32LE(jsonPaddedLen, off); off += 4;
glb.writeUInt32LE(0x4E4F534A,   off); off += 4; // "JSON"
jsonBytes.copy(glb, off); off += jsonBytes.length;
glb.fill(0x20, off, off + (jsonPaddedLen - jsonBytes.length)); off += jsonPaddedLen - jsonBytes.length;

// BIN chunk
glb.writeUInt32LE(binPaddedLen, off); off += 4;
glb.writeUInt32LE(0x004E4942,  off); off += 4; // "BIN\0"
binData.copy(glb, off); off += binData.length;
// (binData is already 4-byte aligned — 1440 bytes)

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, glb);
console.log(`✓ ${VERT_COUNT} vertices, 20 faces, ${glb.length} bytes → ${OUT_PATH}`);

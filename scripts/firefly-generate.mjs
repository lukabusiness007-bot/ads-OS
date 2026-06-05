#!/usr/bin/env node
/**
 * Generates the Veridian hero poster via Adobe Firefly REST API (v3, image4_ultra).
 * Reads credentials from ads-OS/.env.local:
 *   FIREFLY_CLIENT_ID=<your_client_id>
 *   FIREFLY_CLIENT_SECRET=<your_client_secret>
 *
 * Get credentials: https://developer.adobe.com/console
 *   → Create project → Add API → Firefly Services → OAuth Server-to-Server
 *
 * Saves output to: public/img/veridian-poster.png
 * Run: node scripts/firefly-generate.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Credentials ───────────────────────────────────────────────────────────────

function loadEnvLocal() {
  try {
    return Object.fromEntries(
      readFileSync(join(ROOT, '.env.local'), 'utf8')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}

const env = { ...loadEnvLocal(), ...process.env };
const CLIENT_ID     = env.FIREFLY_CLIENT_ID;
const CLIENT_SECRET = env.FIREFLY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(`
ERROR: Adobe Firefly credentials not found.

Add these two lines to ads-OS/.env.local:
  FIREFLY_CLIENT_ID=<your_client_id>
  FIREFLY_CLIENT_SECRET=<your_client_secret>

How to get them:
  1. Go to https://developer.adobe.com/console
  2. Create a new project (or open an existing one)
  3. Add API → Firefly Services (under Creative Cloud)
  4. Choose "OAuth Server-to-Server"
  5. Copy the Client ID and Client Secret shown
`);
  process.exit(1);
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const PROMPT = `Photorealistic studio product shot of a single faceted low-poly icosahedron levitating in the exact center of the frame. The solid is cut from deep emerald gemstone glass, jewel green, exactly twenty flat triangular facets, razor-sharp clean edges, polished mirror-smooth faces with rich internal refraction, subtle caustics and a faint inner glow. Soft three-point studio lighting: a large soft-box key light from the upper left, a cool rim light grazing the top-right edges, gentle fill. 85mm macro lens, f/4, shallow depth of field, crisp specular highlights. Seamless warm off-white cream studio backdrop with soft graduated falloff. Soft contact shadow and a faint emerald color-bleed pooling beneath the object. Minimal, premium, nature-inspired luxury-tech aesthetic. Ultra-detailed, high dynamic range, physically based rendering, 8k, tack-sharp.`;

const NEGATIVE_PROMPT = `text, logo, watermark, people, hands, clutter, multiple objects, busy background, cartoon, flat shading, plastic look, noise, blown highlights, tilt, dutch angle, furniture, chair, table, sphere, cube`;

// ── IMS Token ─────────────────────────────────────────────────────────────────

async function getAccessToken() {
  process.stdout.write('→ Requesting Adobe IMS access token... ');
  const res = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'openid,AdobeID,firefly_api,ff_apis',
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`IMS token failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) throw new Error('IMS response missing access_token');
  console.log(`OK (expires ${data.expires_in}s)`);
  return data.access_token;
}

// ── Submit generation job ─────────────────────────────────────────────────────

async function submitJob(token) {
  process.stdout.write('→ Submitting Firefly generation job (image4_ultra, 1:1 2048px)... ');

  const res = await fetch('https://firefly-api.adobe.io/v3/images/generate-async', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': CLIENT_ID,
      'Authorization': `Bearer ${token}`,
      'x-model-version': 'image4_ultra',
    },
    body: JSON.stringify({
      prompt: PROMPT,
      negativePrompt: NEGATIVE_PROMPT,
      contentClass: 'photo',
      numVariations: 1,
      size: { width: 2048, height: 2048 },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Job submit failed ${res.status}: ${text}`);
  }

  // Status URL from Link header: <url>;rel="status"
  const link = res.headers.get('link') || '';
  const m = link.match(/<([^>]+)>;rel="status"/i);
  if (m) { console.log('OK'); return m[1]; }

  // Fallback: body
  const body = await res.json().catch(() => ({}));
  const url = body?.links?.status?.href ?? body?.statusUrl;
  if (url) { console.log('OK'); return url; }

  throw new Error(`Cannot find status URL.\nHeaders: ${link}\nBody: ${JSON.stringify(body)}`);
}

// ── Poll until done ───────────────────────────────────────────────────────────

async function poll(statusUrl, token, maxMs = 120_000) {
  const deadline = Date.now() + maxMs;
  let attempt = 0;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000));
    attempt++;
    process.stdout.write(`  attempt ${attempt}... `);

    const res = await fetch(statusUrl, {
      headers: { 'X-Api-Key': CLIENT_ID, 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) { console.log(`HTTP ${res.status}, retrying`); continue; }

    const data = await res.json();

    // Normalise status across API response shapes
    const status = (
      data.status ??
      data.outputs?.[0]?.status ??
      data.outputs?.[0]?.state
    )?.toLowerCase();

    console.log(`status=${status ?? '?'}`);

    if (status === 'succeeded' || data.outputs?.[0]?.image?.url) return data;
    if (status === 'failed' || status === 'error') {
      throw new Error(`Generation failed: ${JSON.stringify(data)}`);
    }
  }
  throw new Error(`Timed out after ${maxMs / 1000}s`);
}

// ── Download image ────────────────────────────────────────────────────────────

async function downloadImage(result) {
  // Try several known response shapes
  const urls = [
    result.outputs?.[0]?.image?.url,
    result.outputs?.[0]?.url,
    result.images?.[0]?.url,
    result.result?.presignedUrl,
  ].filter(Boolean);

  if (!urls.length) {
    throw new Error(`No image URL in result: ${JSON.stringify(result)}`);
  }

  const imageUrl = urls[0];
  process.stdout.write(`→ Downloading image (${imageUrl.slice(0, 60)}...)... `);

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Download failed ${imgRes.status}`);

  const buf = Buffer.from(await imgRes.arrayBuffer());
  const out = join(ROOT, 'public', 'img', 'veridian-poster.png');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  console.log(`OK (${(buf.length / 1024).toFixed(0)} KB)`);
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nVeridian Firefly Hero Generator\n');
  try {
    const token     = await getAccessToken();
    const statusUrl = await submitJob(token);
    const result    = await poll(statusUrl, token);
    const outPath   = await downloadImage(result);
    console.log(`\n✅  Hero poster saved → ${outPath}`);
  } catch (err) {
    console.error(`\n❌  ${err.message}`);
    process.exit(1);
  }
}

main();

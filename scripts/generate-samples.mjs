#!/usr/bin/env node
/**
 * Generate sample thumbnail images for a weekly theme.
 *
 * Usage:
 *   REPLICATE_API_TOKEN=... node scripts/generate-samples.mjs <slug> [--size 512]
 *
 * Reads themes.json, finds the week matching `slug`, runs each prompt
 * through flux-schnell (cheap, ~$0.003 per image) via Replicate's REST
 * API (no SDK dep so this works without npm install), writes outputs
 * to /public/samples/<slug>/<id>.jpg, and updates themes.json with the
 * relative sample paths.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const sizeArg = args.indexOf("--size");
const SIZE = sizeArg >= 0 ? Number(args[sizeArg + 1]) : 512;

if (!slug) {
  console.error("Usage: node scripts/generate-samples.mjs <slug> [--size 512]");
  process.exit(1);
}

const token = process.env.REPLICATE_API_TOKEN;
if (!token) {
  console.error(
    "REPLICATE_API_TOKEN not set. Run: vercel env pull .env.local && source .env.local",
  );
  process.exit(1);
}

const themesPath = path.join(ROOT, "src/lib/themes.json");
const themes = JSON.parse(await fs.readFile(themesPath, "utf8"));
const week = themes.weeks.find((w) => w.slug === slug);
if (!week) {
  console.error(`No week with slug "${slug}" in themes.json`);
  process.exit(1);
}

const outDir = path.join(ROOT, "public/samples", slug);
await fs.mkdir(outDir, { recursive: true });

console.log(
  `Generating ${week.prompts.length} samples for "${week.display_name}" @ ${SIZE}px (flux-schnell)`,
);

async function runPrediction(prompt) {
  // Use the sync endpoint so we don't have to poll. flux-schnell is fast
  // enough (~2s) that a blocking call is reliable.
  const r = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "jpg",
          output_quality: 80,
          num_inference_steps: 4,
          megapixels: SIZE >= 1024 ? "1" : "0.25",
          disable_safety_checker: false,
        },
      }),
    },
  );
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Replicate ${r.status}: ${text}`);
  }
  const j = await r.json();
  if (j.status !== "succeeded") {
    // If it didn't finish within the wait, fall back to polling
    let current = j;
    while (
      current.status === "starting" ||
      current.status === "processing"
    ) {
      await new Promise((res) => setTimeout(res, 1500));
      const pr = await fetch(current.urls.get, {
        headers: { Authorization: `Bearer ${token}` },
      });
      current = await pr.json();
    }
    if (current.status !== "succeeded") {
      throw new Error(`Prediction ended with status ${current.status}: ${current.error ?? "unknown"}`);
    }
    return current.output;
  }
  return j.output;
}

for (const p of week.prompts) {
  const outFile = path.join(outDir, `${p.id}.jpg`);
  console.log(`  → ${p.id} (${p.label})`);
  // Prefer a catalog-styled sample_prompt when present; fall back to the
  // inpainting prompt otherwise.
  const promptText = p.sample_prompt ?? p.prompt;
  const output = await runPrediction(promptText);
  const url = Array.isArray(output) ? output[0] : output;
  if (!url || typeof url !== "string") {
    throw new Error(`Unexpected output shape for ${p.id}: ${JSON.stringify(output)}`);
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed for ${p.id}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outFile, buf);
  console.log(
    `     saved ${path.relative(ROOT, outFile)} (${(buf.length / 1024).toFixed(1)} KB)`,
  );
}

// Update themes.json with relative sample paths
let mutated = false;
for (const p of week.prompts) {
  const samplePath = `/samples/${slug}/${p.id}.jpg`;
  if (p.sample !== samplePath) {
    p.sample = samplePath;
    mutated = true;
  }
}
if (mutated) {
  await fs.writeFile(themesPath, JSON.stringify(themes, null, 2) + "\n");
  console.log("Updated themes.json with sample paths");
}

console.log(`\nDone. Samples in public/samples/${slug}/`);

import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Launch model: SDXL Inpainting — $0.003/gen, safety filter built-in
export const MODEL =
  "lucataco/sdxl-inpainting:a5b13068cc81a89a4fbeefeccc774869fcb34df4dbc92c1555e0f2771d49dde7";

export async function runInpaint(input: {
  imageUrl: string;
  maskUrl: string;
  prompt: string;
  negativePrompt: string;
}): Promise<string> {
  const output = (await replicate.run(MODEL as `${string}/${string}:${string}`, {
    input: {
      image: input.imageUrl,
      mask: input.maskUrl,
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      num_inference_steps: 30,
      guidance_scale: 7.5,
      strength: 0.95,
    },
  })) as unknown;

  if (Array.isArray(output)) return String(output[0]);
  if (output && typeof output === "object" && "url" in (output as any)) {
    const u = (output as any).url;
    return typeof u === "function" ? u() : u;
  }
  return String(output);
}

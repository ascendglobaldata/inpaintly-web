import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Launch model: FLUX Fill Pro — handles RGBA masks cleanly, avoids SDXL tensor dim bug
export const MODEL = "black-forest-labs/flux-fill-pro";

export async function runInpaint(input: {
  imageUrl: string;
  maskUrl: string;
  prompt: string;
  negativePrompt: string;
}): Promise<string> {
  const output = (await replicate.run(MODEL as `${string}/${string}`, {
    input: {
      image: input.imageUrl,
      mask: input.maskUrl,
      prompt: input.prompt,
      steps: 50,
      guidance: 40,
      output_format: "png",
      prompt_upsampling: true,
      safety_tolerance: 6,
    },
  })) as unknown;

  if (Array.isArray(output)) return String(output[0]);
  if (output && typeof output === "object" && "url" in (output as any)) {
    const u = (output as any).url;
    return typeof u === "function" ? u() : u;
  }
  return String(output);
}

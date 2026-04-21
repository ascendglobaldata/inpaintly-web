/**
 * Placeholder for server-side mask dilation.
 *
 * For v1 we pass the mask straight through to Replicate — the brush on the
 * client is forgiving enough, and SDXL inpainting feathering handles most
 * edge blending. If we see hard seams in launch feedback, revisit this with
 * `sharp` as a dependency and a proper dilation pass.
 */
export async function dilateMask(buf: Buffer): Promise<Buffer> {
  return buf;
}

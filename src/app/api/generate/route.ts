import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { runInpaint } from "@/lib/replicate";
import { dilateMask } from "@/lib/mask";

export const runtime = "nodejs";
export const maxDuration = 60;

async function downloadToBuffer(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authed" }, { status: 401 });

  const admin = createAdminClient();

  const form = await request.formData();
  const image = form.get("image") as File | null;
  const mask = form.get("mask") as File | null;
  const prompt = String(form.get("prompt") ?? "").slice(0, 400);
  const negativePrompt = String(form.get("negative_prompt") ?? "").slice(0, 400);
  const themeSlug = String(form.get("theme") ?? "custom");

  if (!image || !mask || !prompt) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // --- 1. Charge 1 credit atomically (or consume a free gen) ---
  // Try paid credit first
  const { data: paid, error: paidErr } = await admin.rpc("deduct_credit", {
    user_id: user.id,
  });

  let paidOrFree: "paid" | "free" = "paid";
  if (paidErr || paid === false || paid === 0) {
    // Fall back to free gen
    const { data: free, error: freeErr } = await admin.rpc("use_free_gen", {
      user_id: user.id,
    });
    if (freeErr || free === false || free === 0) {
      return NextResponse.json({ error: "no_credits" }, { status: 402 });
    }
    paidOrFree = "free";
  }

  // --- 2. Upload input + mask to Storage ---
  const ts = Date.now();
  const inputPath = `${user.id}/${ts}_input.png`;
  const maskPath = `${user.id}/${ts}_mask.png`;

  const inputBuf = Buffer.from(await image.arrayBuffer());
  const maskBuf = await dilateMask(Buffer.from(await mask.arrayBuffer()));

  const upI = await admin.storage.from("inputs").upload(inputPath, inputBuf, {
    contentType: "image/png",
    upsert: true,
  });
  const upM = await admin.storage.from("masks").upload(maskPath, maskBuf, {
    contentType: "image/png",
    upsert: true,
  });
  if (upI.error || upM.error) {
    await admin.rpc(
      paidOrFree === "paid" ? "refund_credit" : "restore_free_gen",
      { user_id: user.id },
    );
    return NextResponse.json(
      { error: "upload_failed", detail: upI.error?.message ?? upM.error?.message },
      { status: 500 },
    );
  }

  // Signed URLs for Replicate to fetch
  const inUrl = await admin.storage
    .from("inputs")
    .createSignedUrl(inputPath, 600);
  const mkUrl = await admin.storage.from("masks").createSignedUrl(maskPath, 600);
  if (!inUrl.data || !mkUrl.data) {
    await admin.rpc(
      paidOrFree === "paid" ? "refund_credit" : "restore_free_gen",
      { user_id: user.id },
    );
    return NextResponse.json({ error: "signed_url_failed" }, { status: 500 });
  }

  // --- 3. Insert generation row as processing ---
  const { data: genRow, error: insErr } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      input_url: inputPath,
      mask_url: maskPath,
      prompt,
      theme_slug: themeSlug,
      model: "sdxl-inpainting",
      status: "processing",
    })
    .select("id")
    .single();
  if (insErr || !genRow) {
    await admin.rpc(
      paidOrFree === "paid" ? "refund_credit" : "restore_free_gen",
      { user_id: user.id },
    );
    return NextResponse.json({ error: "db_insert_failed" }, { status: 500 });
  }

  // --- 4. Call Replicate ---
  try {
    const outUrl = await runInpaint({
      imageUrl: inUrl.data.signedUrl,
      maskUrl: mkUrl.data.signedUrl,
      prompt,
      negativePrompt,
    });

    // Persist the output into Storage so links don't expire
    const outBuf = await downloadToBuffer(outUrl);
    const outPath = `${user.id}/${ts}_output.png`;
    const upO = await admin.storage.from("outputs").upload(outPath, outBuf, {
      contentType: "image/png",
      upsert: true,
    });
    if (upO.error) throw new Error("output_upload: " + upO.error.message);

    const pub = admin.storage.from("outputs").getPublicUrl(outPath);
    await admin
      .from("generations")
      .update({
        status: "complete",
        output_url: outPath,
      })
      .eq("id", genRow.id);

    return NextResponse.json({
      ok: true,
      url: pub.data.publicUrl,
      generation_id: genRow.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    await admin
      .from("generations")
      .update({ status: "failed", error_message: msg })
      .eq("id", genRow.id);
    await admin.rpc(
      paidOrFree === "paid" ? "refund_credit" : "restore_free_gen",
      { user_id: user.id },
    );
    return NextResponse.json({ error: "generation_failed", detail: msg }, { status: 500 });
  }
}

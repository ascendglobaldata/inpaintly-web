import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhook } from "@/lib/payments/lemonsqueezy";
import { PACKS, type PackKey } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * LemonSqueezy webhook handler.
 *
 * We treat `order_created` as the trigger to credit the user. LS sends
 * the `custom` object from checkout_data back on the order payload at
 * `meta.custom_data`, where we embedded { user_id, pack }.
 *
 * We also de-duplicate by recording the LS order id in `purchases.provider_ref`
 * and skipping if we've already processed it.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  const { ok, event, data } = verifyWebhook({ rawBody, signature });
  if (!ok) return NextResponse.json({ error: "bad_sig" }, { status: 400 });

  if (event !== "order_created") {
    // Still 200 so LS stops retrying.
    return NextResponse.json({ ok: true, ignored: event });
  }

  const payload = data as {
    data: { id: string; attributes: { total: number; currency: string } };
    meta: { custom_data?: { user_id?: string; pack?: string } };
  };

  const userId = payload?.meta?.custom_data?.user_id;
  const pack = payload?.meta?.custom_data?.pack as PackKey | undefined;
  const orderId = payload?.data?.id;

  if (!userId || !pack || !(pack in PACKS) || !orderId) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: skip if this order is already recorded.
  const { data: existing } = await admin
    .from("purchases")
    .select("id")
    .eq("provider", "lemonsqueezy")
    .eq("provider_ref", orderId)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  const credits = PACKS[pack].credits;
  const priceUsd = PACKS[pack].price_usd;

  // Insert purchase row
  const { error: pErr } = await admin.from("purchases").insert({
    user_id: userId,
    provider: "lemonsqueezy",
    provider_ref: orderId,
    pack,
    credits,
    amount_usd: priceUsd,
    status: "completed",
  });
  if (pErr) {
    return NextResponse.json(
      { error: "purchase_insert_failed", detail: pErr.message },
      { status: 500 },
    );
  }

  // Atomic credit top-up via RPC
  const { error: cErr } = await admin.rpc("add_credits", {
    user_id: userId,
    amount: credits,
  });
  if (cErr) {
    return NextResponse.json(
      { error: "add_credits_failed", detail: cErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

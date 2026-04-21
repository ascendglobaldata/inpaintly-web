import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhook, packFromProductId } from "@/lib/payments/polar";
import { PACKS, type PackKey } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Polar webhook handler.
 *
 * We treat `order.created` (or `checkout.updated` with status=succeeded) as
 * the trigger to credit the user. Polar echoes our checkout metadata on the
 * event payload at `data.metadata`, where we embedded { user_id, pack }.
 *
 * Polar uses the Standard Webhooks spec, which needs three headers:
 *   webhook-id, webhook-timestamp, webhook-signature
 * We pack them into a single pipe-delimited string before calling the
 * provider's verifyWebhook so the provider-agnostic interface stays uniform.
 *
 * De-duplication is done on the Polar order/checkout id via purchases.provider_ref.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookId = request.headers.get("webhook-id") ?? "";
  const webhookTimestamp = request.headers.get("webhook-timestamp") ?? "";
  const webhookSignature = request.headers.get("webhook-signature") ?? "";

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ error: "missing_headers" }, { status: 400 });
  }

  const packedSignature = `${webhookId}|${webhookTimestamp}|${webhookSignature}`;
  const { ok, event, data } = verifyWebhook({
    rawBody,
    signature: packedSignature,
  });
  if (!ok) return NextResponse.json({ error: "bad_sig" }, { status: 400 });

  // Polar's order lifecycle emits several events. We credit on order.created
  // (paid order confirmed). Other events ack-200 so Polar stops retrying.
  if (event !== "order.created") {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const payload = data as {
    data: {
      id: string;
      amount?: number;
      currency?: string;
      metadata?: { user_id?: string; pack?: string };
      product_id?: string;
    };
  };

  const orderId = payload?.data?.id;
  const meta = payload?.data?.metadata ?? {};
  const userId = meta.user_id;
  let pack = meta.pack as PackKey | undefined;

  // Fallback: derive pack from product_id if metadata got stripped
  if ((!pack || !(pack in PACKS)) && payload?.data?.product_id) {
    const derived = packFromProductId(payload.data.product_id);
    if (derived) pack = derived;
  }

  if (!userId || !pack || !(pack in PACKS) || !orderId) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency
  const { data: existing } = await admin
    .from("purchases")
    .select("id")
    .eq("provider", "polar")
    .eq("provider_ref", orderId)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  const credits = PACKS[pack].credits;
  const priceUsd = PACKS[pack].price_usd;

  const { error: pErr } = await admin.from("purchases").insert({
    user_id: userId,
    provider: "polar",
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

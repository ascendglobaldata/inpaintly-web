import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhook, packFromPriceId } from "@/lib/payments/paddle";
import { PACKS, type PackKey } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Paddle webhook handler.
 *
 * We act on `transaction.completed`. Paddle returns custom_data inside the
 * transaction payload, which we set on checkout creation with
 * { user_id, pack }. We also fall back to mapping by price_id if custom_data
 * is missing (eg. for Paddle-hosted price links).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature") ?? "";

  const { ok, event, data } = verifyWebhook({ rawBody, signature });
  if (!ok) return NextResponse.json({ error: "bad_sig" }, { status: 400 });

  if (event !== "transaction.completed") {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const payload = data as {
    data: {
      id: string;
      custom_data?: { user_id?: string; pack?: string };
      items?: { price?: { id: string } }[];
    };
  };

  const tx = payload?.data;
  const userId = tx?.custom_data?.user_id;
  let pack = tx?.custom_data?.pack as PackKey | undefined;
  const txId = tx?.id;

  // Fall back to inferring pack from price_id
  if (!pack && tx?.items?.[0]?.price?.id) {
    const inferred = packFromPriceId(tx.items[0].price!.id);
    if (inferred) pack = inferred;
  }

  if (!userId || !pack || !(pack in PACKS) || !txId) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency
  const { data: existing } = await admin
    .from("purchases")
    .select("id")
    .eq("provider", "paddle")
    .eq("provider_ref", txId)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  const credits = PACKS[pack].credits;
  const priceUsd = PACKS[pack].price_usd;

  const { error: pErr } = await admin.from("purchases").insert({
    user_id: userId,
    provider: "paddle",
    provider_ref: txId,
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

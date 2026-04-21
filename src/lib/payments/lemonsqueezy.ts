import crypto from "crypto";
import { PACKS, type PackKey } from "@/lib/utils";

const API = "https://api.lemonsqueezy.com/v1";
const VARIANTS: Record<PackKey, string | undefined> = {
  starter: process.env.LEMONSQUEEZY_VARIANT_STARTER,
  popular: process.env.LEMONSQUEEZY_VARIANT_POPULAR,
  pro: process.env.LEMONSQUEEZY_VARIANT_PRO,
};

export async function createCheckoutUrl(args: {
  pack: PackKey;
  userId: string;
  userEmail: string;
}): Promise<string> {
  const variantId = VARIANTS[args.pack];
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const key = process.env.LEMONSQUEEZY_API_KEY;

  if (!variantId || !storeId || !key)
    throw new Error("LemonSqueezy not configured");

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: args.userEmail,
          custom: { user_id: args.userId, pack: args.pack },
        },
        checkout_options: { embed: false, dark: false },
        product_options: {
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?purchase=success`,
          receipt_thank_you_note: "Your credits are now in your account.",
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };

  const r = await fetch(`${API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`LemonSqueezy error: ${r.status}`);
  const j = await r.json();
  return j.data.attributes.url;
}

export function verifyWebhook(args: {
  rawBody: string;
  signature: string;
}): { ok: boolean; event?: string; data?: unknown } {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return { ok: false };
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(args.rawBody, "utf8").digest("hex");
  const ok =
    args.signature.length === digest.length &&
    crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(args.signature));
  if (!ok) return { ok: false };
  const parsed = JSON.parse(args.rawBody);
  return {
    ok: true,
    event: parsed?.meta?.event_name,
    data: parsed,
  };
}

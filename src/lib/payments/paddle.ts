import crypto from "crypto";
import { PACKS, type PackKey } from "@/lib/utils";

/**
 * Paddle Billing (v2) provider.
 *
 * We use Paddle's server-side "transactions" API to create a hosted checkout,
 * then return the checkout URL. On completion Paddle sends a webhook we verify
 * via HMAC on the raw body using PADDLE_NOTIFICATION_KEY.
 */

const API = "https://api.paddle.com";

const PRICES: Record<PackKey, string | undefined> = {
  starter: process.env.PADDLE_PRICE_STARTER,
  popular: process.env.PADDLE_PRICE_POPULAR,
  pro: process.env.PADDLE_PRICE_PRO,
};

export async function createCheckoutUrl(args: {
  pack: PackKey;
  userId: string;
  userEmail: string;
}): Promise<string> {
  const priceId = PRICES[args.pack];
  const key = process.env.PADDLE_API_KEY;
  if (!priceId || !key) throw new Error("Paddle not configured");

  const body = {
    items: [{ price_id: priceId, quantity: 1 }],
    customer: { email: args.userEmail },
    custom_data: { user_id: args.userId, pack: args.pack },
    checkout: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/account?purchase=success`,
    },
    collection_mode: "automatic",
  };

  const r = await fetch(`${API}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Paddle error: ${r.status} ${text}`);
  }
  const j = await r.json();
  const url = j?.data?.checkout?.url;
  if (!url) throw new Error("Paddle returned no checkout url");
  return url;
}

/**
 * Paddle signs the raw body with a notification key.
 * The Paddle-Signature header looks like:
 *   ts=1696968600;h1=abc123...
 * We HMAC-SHA256 over `${ts}:${rawBody}` with the key and compare h1.
 */
export function verifyWebhook(args: {
  rawBody: string;
  signature: string;
}): { ok: boolean; event?: string; data?: unknown } {
  const key = process.env.PADDLE_NOTIFICATION_KEY;
  if (!key) return { ok: false };

  const parts = Object.fromEntries(
    args.signature.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    }),
  );
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return { ok: false };

  const payload = `${ts}:${args.rawBody}`;
  const digest = crypto.createHmac("sha256", key).update(payload).digest("hex");
  if (h1.length !== digest.length) return { ok: false };
  const ok = crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(digest));
  if (!ok) return { ok: false };

  const parsed = JSON.parse(args.rawBody);
  return {
    ok: true,
    event: parsed?.event_type,
    data: parsed,
  };
}

/**
 * Pack discovery for webhooks.
 * Given a Paddle price_id coming back in a webhook, return the pack key.
 */
export function packFromPriceId(priceId: string): PackKey | null {
  for (const k of Object.keys(PRICES) as PackKey[]) {
    if (PRICES[k] === priceId) return k;
  }
  return null;
}

export { PACKS };

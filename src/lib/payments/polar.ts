import crypto from "crypto";
import { PACKS, type PackKey } from "@/lib/utils";

/**
 * Polar provider.
 *
 * Checkout: POST https://api.polar.sh/v1/checkouts/ with a Bearer access token.
 * We pass product IDs (one per pack) and embed user_id + pack in metadata so
 * the webhook can credit the correct user.
 *
 * Webhook: Polar uses the Standard Webhooks spec. Three headers are required:
 *   - webhook-id
 *   - webhook-timestamp
 *   - webhook-signature  (format: "v1,<base64-hmac>" — may contain multiple
 *     space-separated entries if the secret is being rotated)
 *
 * The provider-agnostic interface only passes one `signature` string, so the
 * webhook route packs all three into a single pipe-delimited string:
 *   `${id}|${timestamp}|${signatureHeader}`
 * which this file parses back out before verifying.
 */

const API = "https://api.polar.sh";

const PRODUCTS: Record<PackKey, string | undefined> = {
  starter: process.env.POLAR_PRODUCT_STARTER,
  popular: process.env.POLAR_PRODUCT_POPULAR,
  pro: process.env.POLAR_PRODUCT_PRO,
};

export async function createCheckoutUrl(args: {
  pack: PackKey;
  userId: string;
  userEmail: string;
}): Promise<string> {
  const productId = PRODUCTS[args.pack];
  const key = process.env.POLAR_ACCESS_TOKEN;
  if (!productId || !key) throw new Error("Polar not configured");

  const body = {
    products: [productId],
    customer_email: args.userEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?purchase=success`,
    metadata: { user_id: args.userId, pack: args.pack },
  };

  const r = await fetch(`${API}/v1/checkouts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Polar error: ${r.status} ${text}`);
  }
  const j = await r.json();
  const url = j?.url;
  if (!url) throw new Error("Polar returned no checkout url");
  return url;
}

/**
 * Verify a Standard Webhooks signature.
 *
 * The secret is stored as `whsec_<base64>` in POLAR_WEBHOOK_SECRET.
 * The payload signed is `${id}.${timestamp}.${rawBody}`.
 * The signature header is `v1,<base64>` — possibly multiple space-separated.
 */
export function verifyWebhook(args: {
  rawBody: string;
  signature: string;
}): { ok: boolean; event?: string; data?: unknown } {
  const rawSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!rawSecret) return { ok: false };

  // Standard Webhooks spec:
  //   - "whsec_<base64>" → strip prefix, base64-decode the rest
  //   - anything else (incl. Polar's "polar_whs_...") → use raw UTF-8 bytes
  //     as the HMAC key, matching the standardwebhooks library behavior.
  const secret: Buffer = rawSecret.startsWith("whsec_")
    ? Buffer.from(rawSecret.slice(6), "base64")
    : Buffer.from(rawSecret, "utf8");

  const parts = args.signature.split("|");
  if (parts.length !== 3) return { ok: false };
  const [webhookId, webhookTimestamp, sigHeader] = parts;
  if (!webhookId || !webhookTimestamp || !sigHeader) return { ok: false };

  // Reject stale messages (>5 min old or >5 min in future) to prevent replay.
  const ts = Number(webhookTimestamp);
  if (!Number.isFinite(ts)) return { ok: false };
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 5 * 60) return { ok: false };

  const payload = `${webhookId}.${webhookTimestamp}.${args.rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

  // The header may contain multiple signatures: "v1,<sig1> v1,<sig2>"
  const received = sigHeader
    .split(" ")
    .map((s) => s.split(",")[1])
    .filter(Boolean);

  let ok = false;
  for (const r of received) {
    if (
      r.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(r), Buffer.from(expected))
    ) {
      ok = true;
      break;
    }
  }
  if (!ok) return { ok: false };

  const parsed = JSON.parse(args.rawBody);
  return {
    ok: true,
    event: parsed?.type,
    data: parsed,
  };
}

/**
 * Pack discovery for webhooks — map a Polar product_id back to a PackKey.
 * Used as a fallback if metadata is missing.
 */
export function packFromProductId(productId: string): PackKey | null {
  for (const k of Object.keys(PRODUCTS) as PackKey[]) {
    if (PRODUCTS[k] === productId) return k;
  }
  return null;
}

export { PACKS };

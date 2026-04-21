/**
 * Provider-agnostic payment layer.
 *
 * At boot we pick one provider via PAYMENT_PROVIDER env var (lemonsqueezy | paddle).
 * All checkout + webhook logic flows through this interface.
 * Swap providers in 30 seconds by changing the env var and redeploying.
 */
import type { PackKey } from "@/lib/utils";
import * as ls from "./lemonsqueezy";
import * as paddle from "./paddle";

export interface PaymentProvider {
  createCheckoutUrl: (args: {
    pack: PackKey;
    userId: string;
    userEmail: string;
  }) => Promise<string>;

  verifyWebhook: (args: {
    rawBody: string;
    signature: string;
  }) => { ok: boolean; event?: string; data?: unknown };
}

const chosen = (process.env.PAYMENT_PROVIDER ?? "lemonsqueezy").toLowerCase();

export const payments: PaymentProvider =
  chosen === "paddle" ? paddle : ls;

export const PROVIDER_NAME = chosen;

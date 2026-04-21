import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Refund Policy — Inpaintly",
  description: "When and how we refund credit purchases.",
};

export default function RefundPage() {
  return (
    <LegalShell>
      <h1>Refund Policy</h1>
      <p className="text-xs text-slate-500">Last updated: 21 April 2026</p>

      <p>
        Inpaintly sells credit packs. A credit is consumed when you
        successfully generate an image. This policy describes when we
        refund a purchase.
      </p>

      <h2>Unused credits &mdash; 7 day window</h2>
      <p>
        If you purchased credits in the last 7 days and have not used any of
        them, email us at <a href="mailto:hello@inpaintly.app">hello@inpaintly.app</a>
        with your account email and order ID. We will refund the full
        purchase within 5 business days to the original payment method.
      </p>

      <h2>Partially used credits</h2>
      <p>
        If some credits from your most recent purchase have been used, we
        will refund the pro-rata value of unused credits within the 7-day
        window. Once a credit is consumed by a successful generation, it
        is non-refundable.
      </p>

      <h2>Failed generations</h2>
      <p>
        A generation that fails on our side &mdash; due to an error from our
        AI provider, a timeout, or an upload failure &mdash; does not consume a
        credit. The credit is automatically refunded to your account within
        seconds. You do not need to contact us for these.
      </p>

      <h2>Safety-filter blocks</h2>
      <p>
        If a prompt is blocked by our safety filter, the credit is refunded
        automatically and a clear message is shown. You do not need to
        contact us.
      </p>

      <h2>Abuse or terms violations</h2>
      <p>
        Accounts terminated for violating our{" "}
        <a href="/terms">Terms of Service</a> (including NSFW content) are
        not eligible for refunds.
      </p>

      <h2>Chargebacks</h2>
      <p>
        Please email us before initiating a chargeback &mdash; most issues
        can be resolved faster than the chargeback process. Accounts with
        fraudulent chargebacks will be suspended.
      </p>

      <h2>How to request a refund</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>
          Email <a href="mailto:hello@inpaintly.app">hello@inpaintly.app</a>{" "}
          from the address on your account.
        </li>
        <li>Include your order ID (visible in your purchase history on your <a href="/account">account page</a>).</li>
        <li>Tell us briefly why you&rsquo;d like a refund.</li>
        <li>We respond within 2 business days.</li>
      </ol>

      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@inpaintly.app">hello@inpaintly.app</a>
      </p>
    </LegalShell>
  );
}

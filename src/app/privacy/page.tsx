import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Inpaintly",
  description: "What data Inpaintly collects, how it is used, and your rights.",
};

export default function PrivacyPage() {
  return (
    <LegalShell>
      <h1>Privacy Policy</h1>
      <p className="text-xs text-slate-500">Last updated: 21 April 2026</p>

      <p>
        This policy explains what data Inpaintly (operated by Ascend Global
        Data (Pvt) Ltd., Colombo, Sri Lanka) collects, how we use it, and
        the rights you have over it.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li><strong>Email address</strong> &mdash; used for account creation and magic-link sign-in.</li>
        <li><strong>Photos you upload</strong> &mdash; stored in a private cloud bucket while we process them.</li>
        <li><strong>Masks you draw</strong> &mdash; stored alongside the input photo.</li>
        <li><strong>Generated outputs</strong> &mdash; stored in a public bucket so you can view and share them.</li>
        <li><strong>Generation metadata</strong> &mdash; prompt text, theme selected, timestamp, success/failure status.</li>
        <li><strong>Purchase metadata</strong> &mdash; which pack you bought, how much you paid, payment provider. We do not receive or store your card details.</li>
      </ul>

      <h2>2. How we use your data</h2>
      <ul>
        <li>To operate the Service (authenticate you, run the AI pipeline, show your history).</li>
        <li>To process payments through our payment providers.</li>
        <li>To prevent abuse and investigate terms violations.</li>
        <li>To communicate service updates and respond to support requests.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data. We do not use your
        photos to train third-party AI models. We do not profile you for ads.
      </p>

      <h2>3. Sub-processors</h2>
      <p>We share data with the following services strictly to provide Inpaintly:</p>
      <ul>
        <li><strong>Supabase</strong> &mdash; authentication, database, and file storage (EU/US).</li>
        <li><strong>Replicate</strong> &mdash; AI inference for inpainting. Your photo and mask are sent here at the moment of generation via a short-lived signed URL.</li>
        <li><strong>Vercel</strong> &mdash; web hosting and edge delivery.</li>
        <li><strong>Polar / LemonSqueezy</strong> &mdash; payment processing. They receive your email and transaction details.</li>
      </ul>

      <h2>4. Retention</h2>
      <ul>
        <li>Account records are retained for the life of your account.</li>
        <li>Input photos, masks, and generated outputs are retained until you delete them or your account is deleted.</li>
        <li>Generation metadata is retained for up to 24 months for service analytics and fraud prevention, then deleted.</li>
      </ul>

      <h2>5. Your rights</h2>
      <p>You may at any time:</p>
      <ul>
        <li><strong>Access</strong> your data (all visible on your <a href="/account">account page</a>).</li>
        <li><strong>Delete</strong> individual generations from your account page.</li>
        <li><strong>Delete your account</strong> and all associated data by emailing us.</li>
        <li><strong>Export</strong> your data by emailing us.</li>
      </ul>
      <p>
        EU/UK users have additional rights under GDPR, including objection
        and rectification. Contact us to exercise them.
      </p>

      <h2>6. Children</h2>
      <p>
        The Service is not intended for anyone under 16. If you believe a
        child has created an account, contact us and we will delete it.
      </p>

      <h2>7. Security</h2>
      <p>
        Transport is encrypted with TLS. Storage is encrypted at rest.
        Input and mask files are stored in private buckets accessible only
        to your authenticated session. We use row-level security policies
        on the database to prevent cross-account access.
      </p>

      <h2>8. International transfers</h2>
      <p>
        Our infrastructure is globally distributed. By using the Service
        you consent to your data being transferred to and processed in the
        United States, European Union, and other regions where our
        sub-processors operate.
      </p>

      <h2>9. Changes</h2>
      <p>
        Material changes to this policy will be notified by email at least
        14 days in advance.
      </p>

      <h2>10. Contact</h2>
      <p>
        For data requests, deletions, or privacy questions:
        <a href="mailto:hello@inpaintly.app"> hello@inpaintly.app</a>
      </p>
    </LegalShell>
  );
}

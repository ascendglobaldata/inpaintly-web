import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — Inpaintly",
  description: "The agreement between you and Inpaintly when you use the service.",
};

export default function TermsPage() {
  return (
    <LegalShell>
      <h1>Terms of Service</h1>
      <p className="text-xs text-slate-500">Last updated: 21 April 2026</p>

      <p>
        These Terms govern your use of Inpaintly (the &ldquo;Service&rdquo;)
        operated by Ascend Global Data (Pvt) Ltd. from Colombo, Sri Lanka
        (&ldquo;Inpaintly&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By
        creating an account or using the Service you agree to these Terms.
      </p>

      <h2>1. What Inpaintly is</h2>
      <p>
        Inpaintly is a web app that lets you upload a photo, paint over a
        region, and use AI to regenerate that region based on a text prompt
        or a curated weekly theme.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 16 years old to use the Service. By using the
        Service you confirm you meet this requirement.
      </p>

      <h2>3. Your account</h2>
      <p>
        Accounts are created via a magic link to your email. You are
        responsible for the security of the email inbox associated with
        your account. We do not store passwords.
      </p>

      <h2>4. Credits and free generations</h2>
      <ul>
        <li>New accounts receive 3 free generations on signup.</li>
        <li>
          Additional generations cost credits, purchased through our payment
          provider.
        </li>
        <li>
          Credits do not expire. They are non-transferable between accounts.
        </li>
        <li>See our <a href="/refund">Refund Policy</a> for details on refunds.</li>
      </ul>

      <h2>5. Your content</h2>
      <p>
        You retain all rights to photos you upload. By uploading you grant
        Inpaintly a limited, worldwide, royalty-free license to store,
        process, and transmit those photos strictly for the purpose of
        providing the Service to you (including sending them to our AI
        provider for inpainting).
      </p>
      <p>
        You are responsible for ensuring you have the rights to any photo
        you upload. You confirm that any recognisable person in a photo
        you upload has consented to your use of that photo.
      </p>

      <h2>6. Generated content</h2>
      <p>
        AI-generated output based on your input is yours to use for personal
        and commercial purposes, subject to the license terms of our
        underlying AI providers. You are responsible for your use of
        generated output.
      </p>

      <h2>7. Prohibited use</h2>
      <p>You agree not to use the Service to create, upload, or distribute:</p>
      <ul>
        <li>
          <strong>Sexual, nude, or sexually suggestive content</strong>
          &mdash; including content that depicts, implies, or is designed to
          elicit such interpretations of any real or fictional person.
        </li>
        <li>Content depicting a real person without their consent.</li>
        <li>Content involving minors in any sexual, violent, or exploitative context.</li>
        <li>Content that incites violence, hatred, or discrimination.</li>
        <li>Content that infringes intellectual property or publicity rights.</li>
        <li>Content designed to deceive, defraud, or impersonate.</li>
        <li>Malware, spam, or scraping of the Service.</li>
      </ul>
      <p>
        We may remove content and terminate accounts that violate these
        rules at our sole discretion and without refund.
      </p>

      <h2>8. Service availability</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo;. We do not guarantee
        uninterrupted availability, and we may suspend or discontinue
        features at any time. Planned maintenance will be communicated
        where reasonable.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Inpaintly&rsquo;s aggregate
        liability to you under or relating to these Terms is limited to
        the greater of (a) US$50 or (b) the amount you paid Inpaintly in
        the 12 months preceding the claim. We are not liable for indirect,
        incidental, or consequential damages.
      </p>

      <h2>10. Changes to these Terms</h2>
      <p>
        We may update these Terms. Material changes will be notified by
        email or an in-app notice at least 14 days before taking effect.
        Continued use after the effective date constitutes acceptance.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of Sri Lanka. Any dispute will
        be subject to the exclusive jurisdiction of the courts of Colombo,
        Sri Lanka.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions? <a href="mailto:hello@inpaintly.app">hello@inpaintly.app</a>
      </p>
    </LegalShell>
  );
}

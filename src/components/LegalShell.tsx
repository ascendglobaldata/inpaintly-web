import Link from "next/link";
import type { ReactNode } from "react";

export function LegalShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-white">
      <header className="flex items-center justify-between p-4 border-b border-slate-200">
        <Link
          href="/"
          className="text-xl font-extrabold bg-brand-gradient bg-clip-text text-transparent"
        >
          Inpaintly
        </Link>
        <nav className="flex gap-4 text-xs text-slate-600">
          <Link href="/terms" className="hover:text-slate-900">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/refund" className="hover:text-slate-900">
            Refunds
          </Link>
        </nav>
      </header>
      <article className="max-w-2xl mx-auto px-5 py-8 text-sm text-slate-700 leading-relaxed space-y-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:underline [&_a]:text-slate-900 pb-16">
        {children}
      </article>
    </main>
  );
}

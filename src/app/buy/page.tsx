"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { PACKS, type PackKey } from "@/lib/utils";

const PACK_ORDER: PackKey[] = ["starter", "popular", "pro"];

const COPY: Record<PackKey, { per: string; best?: string; desc: string }> = {
  starter: {
    per: "$0.50 per image",
    desc: "Try a full week's theme set.",
  },
  popular: {
    per: "$0.43 per image",
    best: "Best value",
    desc: "Enough to play with every vibe.",
  },
  pro: {
    per: "$0.37 per image",
    desc: "For power users and content creators.",
  },
};

export default function BuyPage() {
  const [loading, setLoading] = useState<PackKey | null>(null);
  const [error, setError] = useState("");

  async function buy(pack: PackKey) {
    setLoading(pack);
    setError("");
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.detail ?? j.error ?? "Checkout failed");
      window.location.href = j.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-slate-200">
        <Link
          href="/studio"
          className="text-xl font-extrabold bg-brand-gradient bg-clip-text text-transparent"
        >
          Inpaintly
        </Link>
        <Link href="/account" className="text-sm text-slate-600 hover:text-slate-900">
          Account
        </Link>
      </header>

      <section className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Buy credits</h1>
        <p className="text-sm text-slate-600 mb-6">
          1 credit = 1 generated image. Credits never expire.
        </p>

        {error ? (
          <div className="bg-red-50 text-red-800 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          {PACK_ORDER.map((key) => {
            const pack = PACKS[key];
            const copy = COPY[key];
            const highlight = key === "popular";
            return (
              <div
                key={key}
                className={`rounded-2xl border p-5 ${
                  highlight
                    ? "border-brand-500 bg-purple-50/40 shadow-sm"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">
                        {pack.label}
                      </h2>
                      {copy.best ? (
                        <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-brand-gradient text-white">
                          {copy.best}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{copy.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-extrabold text-slate-900">
                      ${pack.price_usd}
                    </div>
                    <div className="text-xs text-slate-500">one-time</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <div className="text-sm">
                    <span className="font-semibold text-slate-900">
                      {pack.credits} credits
                    </span>
                    <span className="text-slate-500"> · {copy.per}</span>
                  </div>
                  <Button
                    onClick={() => buy(key)}
                    loading={loading === key}
                    variant={highlight ? "primary" : "secondary"}
                    className="px-5"
                  >
                    Buy
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 mt-6 leading-relaxed">
          Prices in USD. Payment handled by our merchant of record.
          See our{" "}
          <a
            href="https://inpaintly.app/refunds.html"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            refund policy
          </a>{" "}
          before buying.
        </p>
      </section>
    </main>
  );
}

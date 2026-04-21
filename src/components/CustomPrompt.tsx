"use client";

import { useState } from "react";
import { Button } from "./Button";

interface Props {
  onBack: () => void;
  onGenerate: (prompt: string, negative: string, meta: { theme: string; label: string }) => void;
  credits: number;
  freeLeft: number;
}

const DEFAULT_NEGATIVE =
  "blurry, distorted, extra limbs, deformed hands, bad anatomy, low quality, cartoon, painting, text, watermark";

/**
 * Dedicated custom-prompt screen — reached from the ThemePicker's "Or use
 * a custom prompt" button. Keeps the theme picker focused on the curated
 * weekly drop while still letting power users describe anything.
 */
export function CustomPrompt({ onBack, onGenerate, credits, freeLeft }: Props) {
  const [text, setText] = useState("");
  const hasCredits = credits > 0 || freeLeft > 0;
  const canGo = text.trim().length >= 4;

  function go() {
    if (!canGo) return;
    onGenerate(text.trim(), DEFAULT_NEGATIVE, {
      theme: "custom",
      label: "Custom prompt",
    });
  }

  return (
    <main className="h-dvh bg-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between p-3 border-b border-slate-200">
        <button onClick={onBack} className="text-sm text-slate-600">
          ← Back
        </button>
        <h1 className="font-semibold text-sm">Custom prompt</h1>
        <div className="text-xs font-medium text-slate-500 whitespace-nowrap">
          {credits > 0
            ? `${credits} credits`
            : freeLeft > 0
            ? `${freeLeft} free left`
            : "0 credits"}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Describe what you want in the painted area
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. a red silk dress at sunset on a beach"
            rows={6}
            maxLength={300}
            autoFocus
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {text.length}/300
          </p>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1">Tips</p>
            Be specific about colour, fabric, lighting, setting. Keep it
            family-friendly — NSFW content is not allowed and won't generate.
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-white">
        {!hasCredits ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => (window.location.href = "/buy")}
          >
            Buy credits to generate
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            disabled={!canGo}
            onClick={go}
          >
            Generate →
          </Button>
        )}
      </footer>
    </main>
  );
}

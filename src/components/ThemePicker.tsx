"use client";

import { useMemo, useState } from "react";
import themes from "@/lib/themes.json";
import { Button } from "./Button";

interface Props {
  onPick: (prompt: string, negative: string, meta: { theme: string; label: string }) => void;
  onUseCustom: () => void;
  onBack: () => void;
  credits: number;
  freeLeft: number;
}

interface Prompt {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
  sample?: string;
}
interface Week {
  week_of: string;
  slug: string;
  display_name: string;
  description: string;
  cover?: string;
  prompts: Prompt[];
}

/**
 * Streamlined theme picker — the weekly drop IS the value prop.
 * Shows only the active week's 4 prompts in large tiles. Other weeks
 * and custom prompt are secondary actions (custom prompt routes to a
 * dedicated screen).
 */
export function ThemePicker({ onPick, onUseCustom, onBack, credits, freeLeft }: Props) {
  const active = useMemo(() => {
    const w = (themes as any).active_week as string;
    return ((themes as any).weeks as Week[]).find((x) => x.week_of === w) ??
      ((themes as any).weeks as Week[])[0];
  }, []);

  const [selected, setSelected] = useState<Prompt | null>(null);

  const hasCredits = credits > 0 || freeLeft > 0;

  function go() {
    if (!selected) return;
    onPick(selected.prompt, selected.negative_prompt, {
      theme: active.slug,
      label: selected.label,
    });
  }

  return (
    <main className="h-dvh bg-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between p-3 border-b border-slate-200">
        <button onClick={onBack} className="text-sm text-slate-600">
          ← Back
        </button>
        <h1 className="font-semibold text-sm">Pick a vibe</h1>
        <div className="text-xs font-medium text-slate-500 whitespace-nowrap">
          {credits > 0
            ? `${credits} credits`
            : freeLeft > 0
            ? `${freeLeft} free left`
            : "0 credits"}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 pt-4 pb-2 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-2 w-2 rounded-full bg-brand-gradient animate-pulse" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              This week's drop
            </p>
          </div>
          <h2 className="text-xl font-extrabold leading-tight">
            {active.display_name}
          </h2>
          <p className="text-xs text-slate-600 mt-1">{active.description}</p>
        </div>

        <div className="px-4 pb-4 max-w-lg mx-auto w-full">
          <div className="grid grid-cols-2 gap-3">
            {active.prompts.slice(0, 4).map((p) => {
              const isSelected = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`relative aspect-[3/4] rounded-2xl border-2 overflow-hidden text-left transition ${
                    isSelected
                      ? "border-brand-500 ring-2 ring-brand-500/40 shadow-lg"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {p.sample ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.sample}
                      alt={p.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-sm font-semibold text-white drop-shadow">
                      {p.label}
                    </p>
                  </div>
                  {isSelected ? (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center shadow">
                      ✓
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <button
            onClick={onUseCustom}
            className="mt-4 w-full text-sm font-medium text-slate-600 hover:text-slate-900 py-2 underline underline-offset-4"
          >
            Or use a custom prompt →
          </button>
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
            disabled={!selected}
            onClick={go}
          >
            Generate →
          </Button>
        )}
      </footer>
    </main>
  );
}

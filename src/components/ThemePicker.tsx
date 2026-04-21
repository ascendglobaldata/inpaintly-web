"use client";

import { useMemo, useState } from "react";
import themes from "@/lib/themes.json";
import { Button } from "./Button";

interface Props {
  onPick: (prompt: string, negative: string, meta: { theme: string; label: string }) => void;
  onBack: () => void;
  credits: number;
  freeLeft: number;
}

interface Prompt {
  id: string;
  label: string;
  prompt: string;
  negative_prompt: string;
}
interface Week {
  week_of: string;
  slug: string;
  display_name: string;
  description: string;
  cover?: string;
  prompts: Prompt[];
}

export function ThemePicker({ onPick, onBack, credits, freeLeft }: Props) {
  const active = useMemo(() => {
    const w = (themes as any).active_week as string;
    return ((themes as any).weeks as Week[]).find((x) => x.week_of === w) ??
      ((themes as any).weeks as Week[])[0];
  }, []);
  const all = ((themes as any).weeks as Week[]).filter(
    (w) => w.slug !== active.slug,
  );

  const [selected, setSelected] = useState<Prompt | null>(null);
  const [custom, setCustom] = useState("");
  const [week, setWeek] = useState<Week>(active);

  const hasCredits = credits > 0 || freeLeft > 0;

  function go() {
    if (custom.trim().length > 3) {
      onPick(
        custom.trim(),
        "blurry, distorted, extra limbs, deformed hands, bad anatomy, low quality, cartoon, painting, text, watermark",
        { theme: "custom", label: "Custom prompt" },
      );
      return;
    }
    if (selected) {
      onPick(selected.prompt, selected.negative_prompt, {
        theme: week.slug,
        label: selected.label,
      });
    }
  }

  const canGo = !!selected || custom.trim().length > 3;

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-slate-200">
        <button onClick={onBack} className="text-sm text-slate-600">
          ← Back
        </button>
        <h1 className="font-semibold">Pick a vibe</h1>
        <div className="text-xs font-medium text-slate-500 whitespace-nowrap">
          {credits > 0
            ? `${credits} credits`
            : freeLeft > 0
            ? `${freeLeft} free left`
            : "0 credits"}
        </div>
      </header>

      <div className="flex-1 px-4 py-6 space-y-8 max-w-lg mx-auto w-full">
        {/* Active week highlight */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-brand-gradient animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              This week
            </p>
          </div>
          <h2 className="text-2xl font-extrabold mb-1">{active.display_name}</h2>
          <p className="text-sm text-slate-600 mb-4">{active.description}</p>
          <div className="grid grid-cols-2 gap-3">
            {active.prompts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setWeek(active);
                  setSelected(p);
                  setCustom("");
                }}
                className={`text-left p-4 rounded-2xl border transition ${
                  selected?.id === p.id
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/30"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-semibold text-sm">{p.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Other weeks */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            More themes
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {all.map((w) => (
              <button
                key={w.slug}
                onClick={() => {
                  setWeek(w);
                  setSelected(w.prompts[0]);
                  setCustom("");
                }}
                className={`snap-start shrink-0 w-48 text-left p-4 rounded-2xl border ${
                  week.slug === w.slug
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200"
                }`}
              >
                <p className="font-bold text-sm">{w.display_name}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {w.description}
                </p>
              </button>
            ))}
          </div>
          {week.slug !== active.slug ? (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {week.prompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    setCustom("");
                  }}
                  className={`text-left p-4 rounded-2xl border transition ${
                    selected?.id === p.id
                      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-sm">{p.label}</p>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {/* Custom prompt */}
        <section>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Or describe your own
          </label>
          <textarea
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setSelected(null);
            }}
            placeholder="e.g. a red silk dress at sunset"
            rows={3}
            maxLength={300}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <p className="text-xs text-slate-400 mt-1">
            {custom.length}/300
          </p>
        </section>
      </div>

      <footer className="sticky bottom-0 bg-white border-t border-slate-200 p-4 pb-[env(safe-area-inset-bottom)]">
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

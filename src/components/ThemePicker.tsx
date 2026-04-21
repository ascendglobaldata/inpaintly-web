"use client";

import { useMemo, useState } from "react";
import {
  getActiveWeek,
  getPreviousWeek,
  type ThemeWeek,
  type ThemePrompt,
} from "@/lib/activeWeek";
import { Button } from "./Button";

interface Props {
  onPick: (prompt: string, negative: string, meta: { theme: string; label: string }) => void;
  onUseCustom: () => void;
  onBack: () => void;
  credits: number;
  freeLeft: number;
}

/**
 * Bi-weekly picker. Two sections visible:
 *   - Top: this week's drop (tagged "THIS WEEK")
 *   - Bottom: last week's drop (tagged "LAST WEEK")
 * Each section shows 4 tiles (one per prompt). User picks one tile from
 * either section then hits Generate. Custom prompt is still available
 * via a secondary link at the bottom.
 */
export function ThemePicker({ onPick, onUseCustom, onBack, credits, freeLeft }: Props) {
  const current: ThemeWeek = useMemo(() => getActiveWeek(), []);
  const previous: ThemeWeek = useMemo(() => getPreviousWeek(), []);
  const showPrevious = previous.slug !== current.slug;

  const [selected, setSelected] = useState<{
    week: ThemeWeek;
    prompt: ThemePrompt;
  } | null>(null);

  const hasCredits = credits > 0 || freeLeft > 0;

  function go() {
    if (!selected) return;
    onPick(selected.prompt.prompt, selected.prompt.negative_prompt, {
      theme: selected.week.slug,
      label: selected.prompt.label,
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
        <WeekSection
          week={current}
          tagLabel="THIS WEEK"
          tagVariant="current"
          selectedId={selected?.prompt.id ?? null}
          onSelect={(prompt) => setSelected({ week: current, prompt })}
        />

        {showPrevious ? (
          <WeekSection
            week={previous}
            tagLabel="LAST WEEK"
            tagVariant="previous"
            selectedId={selected?.prompt.id ?? null}
            onSelect={(prompt) => setSelected({ week: previous, prompt })}
          />
        ) : null}

        <div className="px-4 pb-6 max-w-lg mx-auto w-full">
          <button
            onClick={onUseCustom}
            className="w-full text-sm font-medium text-slate-600 hover:text-slate-900 py-2 underline underline-offset-4"
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

function WeekSection({
  week,
  tagLabel,
  tagVariant,
  selectedId,
  onSelect,
}: {
  week: ThemeWeek;
  tagLabel: string;
  tagVariant: "current" | "previous";
  selectedId: string | null;
  onSelect: (prompt: ThemePrompt) => void;
}) {
  return (
    <section className="px-4 pt-4 pb-3 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            tagVariant === "current"
              ? "bg-brand-gradient text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {tagVariant === "current" ? (
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          ) : null}
          {tagLabel}
        </span>
      </div>
      <h2 className="text-xl font-extrabold leading-tight">{week.display_name}</h2>
      <p className="text-xs text-slate-600 mt-1 mb-3">{week.description}</p>

      <div className="grid grid-cols-2 gap-3">
        {week.prompts.slice(0, 4).map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
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
    </section>
  );
}

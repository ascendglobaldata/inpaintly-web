"use client";

import { useState } from "react";
import { Button } from "./Button";

interface Props {
  url: string;
  generationId: string;
  onRegenerate: () => void;
  onStartOver: () => void;
}

export function ResultView({ url, generationId, onRegenerate, onStartOver }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function toggleSave() {
    if (!generationId || saving) return;
    setSaving(true);
    setSaveError("");
    const want = !saved;
    try {
      const r = await fetch(`/api/generations/${generationId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: want }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        if (j.error === "cap_reached") {
          setSaveError("You can save up to 2 outfits. Free a slot in your account first.");
        } else {
          setSaveError(j.detail ?? j.error ?? "Couldn't save");
        }
        return;
      }
      setSaved(j.saved);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function share() {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "inpaintly.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Made with Inpaintly" });
        return;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = "inpaintly.png";
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  }

  return (
    <main className="h-dvh bg-slate-900 text-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between p-3 border-b border-white/10">
        <button
          onClick={onStartOver}
          className="text-sm text-slate-300 hover:text-white"
        >
          ✕ New
        </button>
        <h1 className="font-semibold text-sm">Your result</h1>
        <button
          onClick={toggleSave}
          disabled={!generationId || saving}
          aria-label={saved ? "Unsave" : "Save"}
          className={`h-9 w-9 rounded-full flex items-center justify-center transition ${
            saved
              ? "bg-yellow-400 text-slate-900"
              : "bg-white/10 text-white hover:bg-white/20"
          } disabled:opacity-40`}
        >
          {saved ? "★" : "☆"}
        </button>
      </header>

      <div className="flex-1 min-h-0 flex items-center justify-center p-2 overflow-hidden">
        <img
          src={url}
          alt="Inpaintly result"
          className="block max-h-[calc(100dvh-180px)] max-w-full rounded-xl shadow-2xl"
        />
      </div>

      {saveError ? (
        <div className="bg-red-500/20 text-red-100 text-xs p-2 text-center">
          {saveError}
        </div>
      ) : null}

      <footer className="p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex gap-3 border-t border-white/10 bg-slate-900/95 backdrop-blur">
        <Button variant="secondary" className="flex-1" onClick={onRegenerate}>
          Try again
        </Button>
        <Button variant="primary" className="flex-1" onClick={share}>
          Save / Share
        </Button>
      </footer>
    </main>
  );
}

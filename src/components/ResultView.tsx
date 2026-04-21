"use client";

import { Button } from "./Button";

interface Props {
  url: string;
  onRegenerate: () => void;
  onStartOver: () => void;
}

export function ResultView({ url, onRegenerate, onStartOver }: Props) {
  async function share() {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "inpaintly.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Made with Inpaintly" });
        return;
      }
      // Desktop fallback: download
      const a = document.createElement("a");
      a.href = url;
      a.download = "inpaintly.png";
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  }

  return (
    <main className="min-h-dvh bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={onStartOver}
          className="text-sm text-slate-300 hover:text-white"
        >
          ✕ New
        </button>
        <h1 className="font-semibold">Your result</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={url}
          alt="Inpaintly result"
          className="max-h-full max-w-full rounded-xl shadow-2xl"
        />
      </div>

      <footer className="p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] flex gap-3 border-t border-white/10 bg-slate-900/95 backdrop-blur">
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

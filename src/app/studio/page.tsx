"use client";

import { useEffect, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { MaskCanvas } from "@/components/MaskCanvas";
import { ThemePicker } from "@/components/ThemePicker";
import { CustomPrompt } from "@/components/CustomPrompt";
import { ResultView } from "@/components/ResultView";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

type Step = "upload" | "mask" | "theme" | "custom" | "generating" | "result";

export default function StudioPage() {
  const supabase = createClient();
  const [step, setStep] = useState<Step>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [maskBlob, setMaskBlob] = useState<Blob | null>(null);
  const [prompt, setPrompt] = useState<{
    prompt: string;
    negative: string;
    theme: string;
  } | null>(null);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(0);
  const [freeLeft, setFreeLeft] = useState(3);

  // Fetch profile credits on mount
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("credits, free_gens_used")
        .eq("id", user.id)
        .single();
      if (data) {
        setCredits(data.credits ?? 0);
        setFreeLeft(Math.max(0, 3 - (data.free_gens_used ?? 0)));
      }
    })();
  }, [supabase]);

  async function generate(
    promptText: string,
    negative: string,
    meta: { theme: string; label: string },
  ) {
    if (!imageFile || !maskBlob) return;
    setPrompt({ prompt: promptText, negative, theme: meta.theme });
    setStep("generating");
    setError("");

    const fd = new FormData();
    fd.append("image", imageFile);
    fd.append("mask", new File([maskBlob], "mask.png", { type: "image/png" }));
    fd.append("prompt", promptText);
    fd.append("negative_prompt", negative);
    fd.append("theme", meta.theme);

    try {
      const r = await fetch("/api/generate", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        if (j.error === "no_credits") {
          window.location.href = "/buy";
          return;
        }
        throw new Error(j.detail ?? j.error ?? "Something went wrong");
      }
      setResultUrl(j.url);
      // Refresh credits
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("credits, free_gens_used")
          .eq("id", user.id)
          .single();
        if (data) {
          setCredits(data.credits ?? 0);
          setFreeLeft(Math.max(0, 3 - (data.free_gens_used ?? 0)));
        }
      }
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep(meta.theme === "custom" ? "custom" : "theme");
    }
  }

  function reset() {
    setImageFile(null);
    setImageUrl("");
    setMaskBlob(null);
    setPrompt(null);
    setResultUrl("");
    setStep("upload");
  }

  if (step === "upload") {
    return (
      <main className="min-h-dvh bg-white flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <span className="text-xl font-extrabold bg-brand-gradient bg-clip-text text-transparent">
            Inpaintly
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">
              {credits > 0
                ? `${credits} credits`
                : freeLeft > 0
                ? `${freeLeft} free left`
                : "0 credits"}
            </span>
            <a href="/account" className="text-sm text-slate-600 hover:text-slate-900">
              Account
            </a>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <UploadZone
            onImageReady={(file, url) => {
              setImageFile(file);
              setImageUrl(url);
              setStep("mask");
            }}
          />
        </div>
      </main>
    );
  }

  if (step === "mask") {
    return (
      <MaskCanvas
        imageDataUrl={imageUrl}
        onBack={() => setStep("upload")}
        onComplete={(blob) => {
          setMaskBlob(blob);
          setStep("theme");
        }}
      />
    );
  }

  if (step === "theme") {
    return (
      <>
        {error ? (
          <div className="bg-red-50 text-red-800 text-sm p-3 text-center">
            {error}
          </div>
        ) : null}
        <ThemePicker
          credits={credits}
          freeLeft={freeLeft}
          onBack={() => setStep("mask")}
          onPick={generate}
          onUseCustom={() => setStep("custom")}
        />
      </>
    );
  }

  if (step === "custom") {
    return (
      <>
        {error ? (
          <div className="bg-red-50 text-red-800 text-sm p-3 text-center">
            {error}
          </div>
        ) : null}
        <CustomPrompt
          credits={credits}
          freeLeft={freeLeft}
          onBack={() => setStep("theme")}
          onGenerate={generate}
        />
      </>
    );
  }

  if (step === "generating") {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center bg-slate-900 text-white px-6">
        <div className="h-20 w-20 rounded-full border-4 border-white/10 border-t-white animate-spin mb-6" />
        <h2 className="text-xl font-semibold mb-1">Painting your photo…</h2>
        <p className="text-sm text-slate-400">Usually takes 10–30 seconds.</p>
      </main>
    );
  }

  if (step === "result") {
    return (
      <ResultView
        url={resultUrl}
        onRegenerate={() => setStep("theme")}
        onStartOver={reset}
      />
    );
  }

  return null;
}

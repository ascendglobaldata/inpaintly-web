"use client";

import { useRef, useState } from "react";
import { Button } from "./Button";

interface Props {
  onImageReady: (file: File, dataUrl: string) => void;
}

/**
 * Takes a File, downsizes to max 1024px (longest edge), returns blob + data URL.
 */
async function normaliseImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });

  const MAX = 1024;
  let { width, height } = img;
  if (width > MAX || height > MAX) {
    const ratio = Math.min(MAX / width, MAX / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob = await new Promise((r) =>
    canvas.toBlob((b) => r(b!), "image/png"),
  );
  const dataUrl = canvas.toDataURL("image/png");
  URL.revokeObjectURL(url);
  return { blob, dataUrl };
}

export function UploadZone({ onImageReady }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file?: File | null) {
    setError("");
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError("Photo is too big — please pick one under 15 MB.");
      return;
    }
    setLoading(true);
    try {
      const { blob, dataUrl } = await normaliseImage(file);
      const normalFile = new File([blob], file.name.replace(/\.\w+$/, ".png"), {
        type: "image/png",
      });
      onImageReady(normalFile, dataUrl);
    } catch (e) {
      setError("Couldn't read that photo. Try another.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 py-6">
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50">
        <div className="text-4xl mb-2">📸</div>
        <h2 className="text-lg font-bold mb-0.5">Add a photo</h2>
        <p className="text-xs text-slate-600 mb-4">
          JPG, PNG or HEIC · up to 15 MB
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => fileInput.current?.click()}
            loading={loading}
          >
            Choose photo
          </Button>
          <Button
            variant="secondary"
            onClick={() => cameraInput.current?.click()}
            loading={loading}
          >
            Take photo
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {error ? (
          <p className="text-sm text-red-600 mt-4">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

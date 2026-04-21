"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

interface Props {
  imageDataUrl: string;
  onComplete: (maskBlob: Blob, maskPreview: string) => void;
  onBack: () => void;
}

const BRUSH_SIZES = { S: 18, M: 36, L: 64 } as const;
type BrushKey = keyof typeof BRUSH_SIZES;

/**
 * Mask canvas: draws on a transparent overlay over the image.
 * Exports an 8-bit mask PNG (white = area to repaint, black = keep)
 * at the same dimensions as the source image.
 */
export function MaskCanvas({ imageDataUrl, onComplete, onBack }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);

  const [brush, setBrush] = useState<BrushKey>("M");
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);

  // Size canvases to the rendered image
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    function fit() {
      const overlay = overlayRef.current!;
      const mask = maskRef.current!;
      // Overlay matches displayed size; mask matches natural size.
      overlay.width = img!.clientWidth;
      overlay.height = img!.clientHeight;
      mask.width = img!.naturalWidth;
      mask.height = img!.naturalHeight;
      const mctx = mask.getContext("2d")!;
      mctx.fillStyle = "#000";
      mctx.fillRect(0, 0, mask.width, mask.height);
    }
    if (img.complete) fit();
    else img.addEventListener("load", fit);
    window.addEventListener("resize", fit);
    return () => {
      img.removeEventListener("load", fit);
      window.removeEventListener("resize", fit);
    };
  }, [imageDataUrl]);

  function canvasPt(e: PointerEvent | React.PointerEvent) {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: (e as PointerEvent).clientX - rect.left,
      y: (e as PointerEvent).clientY - rect.top,
    };
  }

  function stroke(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    size: number,
    colour: string,
  ) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!overlayRef.current || !maskRef.current || !imgRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    const pt = canvasPt(e);
    lastPt.current = pt;

    // Snapshot for undo
    const octx = overlayRef.current.getContext("2d")!;
    setHistory((h) => [
      ...h.slice(-9),
      octx.getImageData(
        0,
        0,
        overlayRef.current!.width,
        overlayRef.current!.height,
      ),
    ]);

    drawDot(pt);
  }

  function drawDot(pt: { x: number; y: number }) {
    const overlay = overlayRef.current!;
    const mask = maskRef.current!;
    const img = imgRef.current!;
    const size = BRUSH_SIZES[brush];

    const octx = overlay.getContext("2d")!;
    octx.fillStyle = "rgba(236,72,153,0.45)"; // brand pink overlay
    octx.beginPath();
    octx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2);
    octx.fill();

    // Write to mask in natural-image coords
    const sx = img.naturalWidth / img.clientWidth;
    const sy = img.naturalHeight / img.clientHeight;
    const mctx = mask.getContext("2d")!;
    mctx.fillStyle = "#fff";
    mctx.beginPath();
    mctx.arc(pt.x * sx, pt.y * sy, (size / 2) * ((sx + sy) / 2), 0, Math.PI * 2);
    mctx.fill();

    setDirty(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current || !overlayRef.current || !maskRef.current || !imgRef.current)
      return;
    e.preventDefault();
    const pt = canvasPt(e);
    const from = lastPt.current ?? pt;
    const size = BRUSH_SIZES[brush];

    stroke(
      overlayRef.current.getContext("2d")!,
      from,
      pt,
      size,
      "rgba(236,72,153,0.45)",
    );

    const img = imgRef.current;
    const sx = img.naturalWidth / img.clientWidth;
    const sy = img.naturalHeight / img.clientHeight;
    stroke(
      maskRef.current.getContext("2d")!,
      { x: from.x * sx, y: from.y * sy },
      { x: pt.x * sx, y: pt.y * sy },
      size * ((sx + sy) / 2),
      "#fff",
    );

    lastPt.current = pt;
    setDirty(true);
  }

  function onPointerUp() {
    drawing.current = false;
    lastPt.current = null;
  }

  function undo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const octx = overlayRef.current!.getContext("2d")!;
    octx.putImageData(prev, 0, 0);
    setHistory((h) => h.slice(0, -1));
    // rebuild mask from overlay (approximate — for v1 this is acceptable)
    const mask = maskRef.current!;
    const mctx = mask.getContext("2d")!;
    mctx.fillStyle = "#000";
    mctx.fillRect(0, 0, mask.width, mask.height);
    // Replay: copy the overlay's pink pixels onto the mask as white
    const scaled = document.createElement("canvas");
    scaled.width = mask.width;
    scaled.height = mask.height;
    const sctx = scaled.getContext("2d")!;
    sctx.drawImage(overlayRef.current!, 0, 0, mask.width, mask.height);
    const pix = sctx.getImageData(0, 0, mask.width, mask.height);
    const data = pix.data;
    const out = mctx.createImageData(mask.width, mask.height);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 40) {
        out.data[i] = out.data[i + 1] = out.data[i + 2] = 255;
        out.data[i + 3] = 255;
      } else {
        out.data[i + 3] = 255;
      }
    }
    mctx.putImageData(out, 0, 0);
    setDirty(history.length > 1);
  }

  function clearAll() {
    const octx = overlayRef.current!.getContext("2d")!;
    octx.clearRect(
      0,
      0,
      overlayRef.current!.width,
      overlayRef.current!.height,
    );
    const mctx = maskRef.current!.getContext("2d")!;
    mctx.fillStyle = "#000";
    mctx.fillRect(0, 0, maskRef.current!.width, maskRef.current!.height);
    setHistory([]);
    setDirty(false);
  }

  async function complete() {
    if (!dirty) return;
    // Dilate mask server-side — send as-is, server expands it before Replicate.
    const mask = maskRef.current!;
    const blob: Blob = await new Promise((r) =>
      mask.toBlob((b) => r(b!), "image/png"),
    );
    const preview = mask.toDataURL("image/png");
    onComplete(blob, preview);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="text-sm text-slate-300 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="font-semibold">Paint the area to change</h1>
        <div className="w-14" />
      </header>

      <div
        ref={wrapRef}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
      >
        <div className="relative inline-block max-h-full">
          <img
            ref={imgRef}
            src={imageDataUrl}
            alt="your photo"
            className="block max-h-full max-w-full rounded-lg select-none"
            draggable={false}
          />
          <canvas
            ref={overlayRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute inset-0 touch-none cursor-crosshair"
            style={{ width: "100%", height: "100%" }}
          />
          <canvas ref={maskRef} className="hidden" />
        </div>
      </div>

      <footer className="p-4 space-y-3 border-t border-white/10 bg-slate-900/95 backdrop-blur">
        <div className="flex items-center justify-center gap-2">
          {(Object.keys(BRUSH_SIZES) as BrushKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setBrush(k)}
              className={`h-11 w-11 rounded-full font-semibold transition ${
                brush === k
                  ? "bg-white text-slate-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {k}
            </button>
          ))}
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="h-11 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
          >
            Undo
          </button>
          <button
            onClick={clearAll}
            disabled={!dirty}
            className="h-11 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-40"
          >
            Clear
          </button>
        </div>
        <Button
          variant="primary"
          className="w-full"
          disabled={!dirty}
          onClick={complete}
        >
          Continue →
        </Button>
      </footer>
    </div>
  );
}

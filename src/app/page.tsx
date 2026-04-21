import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TILES = [
  { src: "/landing/image1.png", label: "CEO Headshot" },
  { src: "/landing/image2.png", label: "Girls Night Out" },
  { src: "/landing/image3.png", label: "Music Festival" },
  { src: "/landing/image4.png", label: "Beach Sunset" },
];

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged in? Go straight to studio.
  if (user) redirect("/studio");

  return (
    <main className="min-h-dvh flex flex-col bg-white">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <span className="text-xl font-extrabold bg-brand-gradient bg-clip-text text-transparent">
          Inpaintly
        </span>
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          Sign in
        </Link>
      </header>

      <section className="px-5 pt-2 pb-4 text-center max-w-md mx-auto w-full">
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          Any photo.{" "}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            Any look.
          </span>
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Paint over a region. Pick a vibe. Watch AI transform it.
        </p>
      </section>

      <section className="flex-1 px-5 max-w-md mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((t) => (
            <figure
              key={t.label}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.src}
                alt={t.label}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p className="text-xs font-semibold uppercase tracking-wider text-white drop-shadow">
                  {t.label}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)] max-w-md mx-auto w-full">
        <Link
          href="/login"
          className="block w-full text-center bg-brand-gradient text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:opacity-95 transition"
        >
          Start — 3 free edits →
        </Link>
        <p className="mt-3 text-xs text-slate-500 text-center">
          No credit card. New theme drops every few days.
        </p>
      </section>
    </main>
  );
}

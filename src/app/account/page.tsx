"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

type Generation = {
  id: string;
  created_at: string;
  status: string;
  theme_slug: string | null;
  prompt: string | null;
  output_url: string | null;
  saved: boolean;
};

type Purchase = {
  id: string;
  created_at: string;
  pack: string;
  credits: number;
  amount_usd: number;
  provider: string;
};

export default function AccountPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState(0);
  const [freeLeft, setFreeLeft] = useState(0);
  const [gens, setGens] = useState<Generation[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [successFlag, setSuccessFlag] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("purchase") === "success") setSuccessFlag(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setEmail(user.email ?? "");

      const [{ data: profile }, { data: genRows }, { data: purchaseRows }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("credits, free_gens_used")
            .eq("id", user.id)
            .single(),
          supabase
            .from("generations")
            .select("id, created_at, status, theme_slug, prompt, output_url, saved")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("purchases")
            .select("id, created_at, pack, credits, amount_usd, provider")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

      if (profile) {
        setCredits(profile.credits ?? 0);
        setFreeLeft(Math.max(0, 3 - (profile.free_gens_used ?? 0)));
      }
      setGens(genRows ?? []);
      setPurchases(purchaseRows ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function deleteGen(id: string) {
    if (!confirm("Delete this generation? This can't be undone.")) return;
    const prev = gens;
    // Optimistic remove
    setGens((g) => g.filter((x) => x.id !== id));
    const r = await fetch(`/api/generations/${id}`, { method: "DELETE" });
    if (!r.ok) {
      alert("Couldn't delete — please try again.");
      setGens(prev);
    }
  }

  async function toggleSave(id: string, want: boolean) {
    const prev = gens;
    // Optimistic flip
    setGens((g) => g.map((x) => (x.id === id ? { ...x, saved: want } : x)));
    const r = await fetch(`/api/generations/${id}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved: want }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      if (j.error === "cap_reached") {
        alert("You can save up to 2 outfits. Unsave one first.");
      } else {
        alert("Couldn't update. Try again.");
      }
      setGens(prev);
    }
  }

  function publicOutputUrl(path: string | null): string | null {
    if (!path) return null;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    return `${base}/storage/v1/object/public/outputs/${path}`;
  }

  return (
    <main className="min-h-dvh bg-white">
      <header className="flex items-center justify-between p-4 border-b border-slate-200">
        <Link
          href="/studio"
          className="text-xl font-extrabold bg-brand-gradient bg-clip-text text-transparent"
        >
          Inpaintly
        </Link>
        <Link href="/studio" className="text-sm text-slate-600 hover:text-slate-900">
          Studio
        </Link>
      </header>

      <section className="max-w-lg mx-auto w-full px-5 py-6">
        {successFlag ? (
          <div className="bg-green-50 text-green-800 text-sm p-3 rounded-lg mb-4">
            Thanks! Your credits should appear below within a few seconds. If
            they don&rsquo;t, refresh this page.
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Signed in as
          </div>
          <div className="text-sm font-medium text-slate-900 break-all mb-4">
            {email}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-purple-50 p-3">
              <div className="text-xs text-slate-600">Credits</div>
              <div className="text-2xl font-extrabold text-slate-900">
                {loading ? "—" : credits}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-600">Free gens left</div>
              <div className="text-2xl font-extrabold text-slate-900">
                {loading ? "—" : freeLeft}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/buy" className="flex-1">
              <Button className="w-full">Buy credits</Button>
            </Link>
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>

        {!loading && gens.filter((g) => g.saved).length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900">Saved outfits</h2>
              <span className="text-xs text-slate-500">
                {gens.filter((g) => g.saved).length} / 2
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {gens
                .filter((g) => g.saved)
                .map((g) => (
                  <GenerationTile
                    key={g.id}
                    gen={g}
                    url={publicOutputUrl(g.output_url)}
                    onDelete={deleteGen}
                    onToggleSave={toggleSave}
                  />
                ))}
            </div>
          </>
        ) : null}

        <h2 className="text-base font-bold text-slate-900 mb-2">
          Recent generations
        </h2>
        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : gens.length === 0 ? (
          <div className="text-sm text-slate-500 mb-6">
            No generations yet.{" "}
            <Link href="/studio" className="underline">
              Try one
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {gens.map((g) => (
              <GenerationTile
                key={g.id}
                gen={g}
                url={publicOutputUrl(g.output_url)}
                onDelete={deleteGen}
                onToggleSave={toggleSave}
                small
              />
            ))}
          </div>
        )}

        <h2 className="text-base font-bold text-slate-900 mb-2">
          Purchase history
        </h2>
        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : purchases.length === 0 ? (
          <div className="text-sm text-slate-500 mb-10">No purchases yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100 mb-10 text-sm">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-slate-900 capitalize">
                    {p.pack} · {p.credits} credits
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(p.created_at).toLocaleDateString()} · {p.provider}
                  </div>
                </div>
                <div className="text-sm font-semibold">${p.amount_usd}</div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-slate-500 leading-relaxed">
          Need help? Email{" "}
          <a href="mailto:hello@inpaintly.app" className="underline">
            hello@inpaintly.app
          </a>
          .
        </p>
      </section>
    </main>
  );
}

function GenerationTile({
  gen,
  url,
  onDelete,
  onToggleSave,
  small = false,
}: {
  gen: Generation;
  url: string | null;
  onDelete: (id: string) => void;
  onToggleSave: (id: string, want: boolean) => void;
  small?: boolean;
}) {
  return (
    <div
      className={`${
        small ? "aspect-square" : "aspect-[3/4]"
      } rounded-lg overflow-hidden bg-slate-100 relative group`}
      title={`${gen.theme_slug ?? ""} — ${gen.status}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={gen.theme_slug ?? "generation"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-[10px] text-slate-500">
          {gen.status}
        </div>
      )}
      <button
        onClick={() => onToggleSave(gen.id, !gen.saved)}
        aria-label={gen.saved ? "Unsave" : "Save"}
        className={`absolute top-1 left-1 h-7 w-7 rounded-full text-xs flex items-center justify-center transition ${
          gen.saved
            ? "bg-yellow-400 text-slate-900"
            : "bg-black/60 text-white hover:bg-black/80"
        }`}
      >
        {gen.saved ? "★" : "☆"}
      </button>
      <button
        onClick={() => onDelete(gen.id)}
        aria-label="Delete generation"
        className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 active:bg-black/90 transition"
      >
        🗑
      </button>
    </div>
  );
}

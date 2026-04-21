"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";

function LoginForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const next = params.get("next") || "/studio";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    setErrorMsg("");

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next,
    )}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setState("error");
      setErrorMsg(error.message);
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div className="text-3xl mb-2">✉️</div>
        <h2 className="font-semibold text-lg mb-1">Check your email</h2>
        <p className="text-sm text-slate-600">
          We sent a login link to <strong>{email}</strong>. Tap it to sign in.
        </p>
        <button
          onClick={() => setState("idle")}
          className="mt-4 text-sm text-brand-600 font-medium"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
      <Button type="submit" loading={state === "loading"} className="w-full">
        Send magic link
      </Button>
      {errorMsg ? (
        <p className="text-sm text-red-600">{errorMsg}</p>
      ) : (
        <p className="text-xs text-slate-500 text-center">
          No password. No spam.
        </p>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-brand-50 to-white">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center text-3xl font-extrabold mb-2"
        >
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            Inpaintly
          </span>
        </Link>
        <p className="text-center text-slate-600 mb-8">
          Enter your email — we&apos;ll send a magic link.
        </p>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-slate-500 mt-6">
          By continuing you agree to our{" "}
          <a
            href="https://inpaintly.app/terms.html"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="https://inpaintly.app/privacy.html"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}

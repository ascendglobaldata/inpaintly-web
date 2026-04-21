import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If logged in, go straight to studio
  if (user) redirect("/studio");

  // Otherwise show a minimal splash with Start button
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-brand-50 to-white">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            Inpaintly
          </span>
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Paint over any photo. AI transforms just that part.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand-gradient text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:opacity-95 transition"
        >
          Start →
        </Link>
        <p className="mt-6 text-sm text-slate-500">
          3 free edits on signup. No credit card.
        </p>
      </div>
    </main>
  );
}

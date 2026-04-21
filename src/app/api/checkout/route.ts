import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { payments } from "@/lib/payments";
import { PACKS, type PackKey } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email)
    return NextResponse.json({ error: "not_authed" }, { status: 401 });

  let pack: PackKey;
  try {
    const body = await request.json();
    pack = body.pack as PackKey;
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  if (!(pack in PACKS))
    return NextResponse.json({ error: "invalid_pack" }, { status: 400 });

  try {
    const url = await payments.createCheckoutUrl({
      pack,
      userId: user.id,
      userEmail: user.email,
    });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "checkout_failed", detail: msg },
      { status: 500 },
    );
  }
}

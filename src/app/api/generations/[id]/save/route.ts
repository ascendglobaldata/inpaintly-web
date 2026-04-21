import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SAVE_CAP = 2;

/**
 * POST /api/generations/[id]/save
 * Body: { saved: boolean }
 *
 * Toggles the saved flag on a generation the authenticated user owns.
 * Enforces a per-user cap of SAVE_CAP saved generations.
 *
 * Response:
 *   { ok: true, saved: boolean, savedCount: number }
 *   { error: "cap_reached" } when the user tries to save past the cap.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authed" }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  let body: { saved?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const wantSaved = body.saved === true;

  // Ownership check via user-scoped client (RLS)
  const { data: row, error: selErr } = await supabase
    .from("generations")
    .select("id, saved")
    .eq("id", id)
    .maybeSingle();
  if (selErr)
    return NextResponse.json(
      { error: "select_failed", detail: selErr.message },
      { status: 500 },
    );
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // No-op if already in desired state
  if (row.saved === wantSaved) {
    const { count } = await supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("saved", true);
    return NextResponse.json({
      ok: true,
      saved: wantSaved,
      savedCount: count ?? 0,
    });
  }

  const admin = createAdminClient();

  if (wantSaved) {
    // Enforce cap before saving
    const { count, error: countErr } = await admin
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("saved", true);
    if (countErr)
      return NextResponse.json(
        { error: "count_failed", detail: countErr.message },
        { status: 500 },
      );
    if ((count ?? 0) >= SAVE_CAP) {
      return NextResponse.json(
        { error: "cap_reached", cap: SAVE_CAP, savedCount: count },
        { status: 409 },
      );
    }
  }

  const { error: updErr } = await admin
    .from("generations")
    .update({
      saved: wantSaved,
      saved_at: wantSaved ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updErr)
    return NextResponse.json(
      { error: "update_failed", detail: updErr.message },
      { status: 500 },
    );

  const { count: newCount } = await admin
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("saved", true);

  return NextResponse.json({
    ok: true,
    saved: wantSaved,
    savedCount: newCount ?? 0,
  });
}

import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * DELETE /api/generations/[id]
 *
 * Removes a generation the authenticated user owns:
 *   1. Verifies ownership via the user-scoped client (respects RLS)
 *   2. Deletes the output file from the `outputs` bucket
 *   3. Deletes the input + mask files from the `inputs` / `masks` buckets
 *   4. Deletes the DB row with the admin client
 *
 * Storage deletes are best-effort — if a file is already missing we still
 * delete the row so the UI stays consistent. Ownership is the gate; if the
 * user doesn't own the row, we return 404 without disclosing existence.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authed" }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  // Ownership check via user-scoped client (RLS enforces user_id = auth.uid())
  const { data: row, error: selErr } = await supabase
    .from("generations")
    .select("id, output_url, input_url, mask_url")
    .eq("id", id)
    .maybeSingle();
  if (selErr)
    return NextResponse.json(
      { error: "select_failed", detail: selErr.message },
      { status: 500 },
    );
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const admin = createAdminClient();

  // Best-effort storage cleanup
  const storageErrors: string[] = [];
  if (row.output_url) {
    const { error } = await admin.storage
      .from("outputs")
      .remove([row.output_url]);
    if (error) storageErrors.push(`outputs: ${error.message}`);
  }
  if (row.input_url) {
    const { error } = await admin.storage.from("inputs").remove([row.input_url]);
    if (error) storageErrors.push(`inputs: ${error.message}`);
  }
  if (row.mask_url) {
    const { error } = await admin.storage.from("masks").remove([row.mask_url]);
    if (error) storageErrors.push(`masks: ${error.message}`);
  }

  // Delete DB row (admin client so it works regardless of DELETE RLS policies)
  const { error: delErr } = await admin
    .from("generations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (delErr) {
    return NextResponse.json(
      { error: "delete_failed", detail: delErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, storageErrors });
}

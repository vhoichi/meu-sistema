import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the drink rows from the most recent upload batch, plus metadata.
 * Responds with { hasData: false } when nothing has been uploaded yet.
 */
export async function GET() {
  const email = getSession();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: latest, error: latestError } = await supabaseAdmin
    .from("uploads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return NextResponse.json({ error: latestError.message }, { status: 500 });
  }

  if (!latest) {
    return NextResponse.json({ hasData: false });
  }

  const { data: drinks, error: drinksError } = await supabaseAdmin
    .from("drinks")
    .select(
      "country, beer_servings, spirit_servings, wine_servings, total_litres_of_pure_alcohol"
    )
    .eq("upload_id", latest.id)
    .order("total_litres_of_pure_alcohol", { ascending: false });

  if (drinksError) {
    return NextResponse.json({ error: drinksError.message }, { status: 500 });
  }

  return NextResponse.json({
    hasData: true,
    upload: {
      id: latest.id,
      filename: latest.filename,
      row_count: latest.row_count,
      uploaded_by: latest.uploaded_by,
      created_at: latest.created_at,
    },
    drinks: drinks ?? [],
  });
}

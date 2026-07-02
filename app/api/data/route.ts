import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Number of most recent upload batches to check when looking for a complete
// one. The insert of `uploads` and `drinks` happens as two separate calls
// (see app/api/upload/route.ts), so a concurrent GET can briefly observe an
// upload row whose drinks haven't been written yet. We skip past any such
// partial batch instead of exposing it to the client.
const MAX_CANDIDATES = 5;

/**
 * Returns the drink rows from the most recent COMPLETE upload batch, plus
 * metadata. A batch is "complete" once its actual drink row count matches
 * the `row_count` recorded on the upload. Responds with { hasData: false }
 * when nothing complete has been uploaded yet.
 */
export async function GET() {
  const email = getSession();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: candidates, error: candidatesError } = await supabaseAdmin
    .from("uploads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_CANDIDATES);

  if (candidatesError) {
    return NextResponse.json(
      { error: candidatesError.message },
      { status: 500 }
    );
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ hasData: false });
  }

  for (const candidate of candidates) {
    const { count, error: countError } = await supabaseAdmin
      .from("drinks")
      .select("id", { count: "exact", head: true })
      .eq("upload_id", candidate.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (count !== candidate.row_count) {
      // Partial (or otherwise inconsistent) batch — skip it and try the
      // next most recent one instead of exposing a mismatched state.
      continue;
    }

    const { data: drinks, error: drinksError } = await supabaseAdmin
      .from("drinks")
      .select(
        "country, beer_servings, spirit_servings, wine_servings, total_litres_of_pure_alcohol"
      )
      .eq("upload_id", candidate.id)
      .order("total_litres_of_pure_alcohol", { ascending: false });

    if (drinksError) {
      return NextResponse.json({ error: drinksError.message }, { status: 500 });
    }

    return NextResponse.json({
      hasData: true,
      upload: {
        id: candidate.id,
        filename: candidate.filename,
        row_count: candidate.row_count,
        uploaded_by: candidate.uploaded_by,
        created_at: candidate.created_at,
      },
      drinks: drinks ?? [],
    });
  }

  return NextResponse.json({ hasData: false });
}

import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CsvRow = {
  country?: string;
  beer_servings?: string;
  spirit_servings?: string;
  wine_servings?: string;
  total_litres_of_pure_alcohol?: string;
};

const REQUIRED_COLUMNS = [
  "country",
  "beer_servings",
  "spirit_servings",
  "wine_servings",
  "total_litres_of_pure_alcohol",
];

function toInt(value: string | undefined): number {
  const n = parseInt((value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function toFloat(value: string | undefined): number {
  const n = parseFloat((value ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

export async function POST(request: Request) {
  const email = getSession();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado." },
      { status: 400 }
    );
  }

  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `CSV inválido. Colunas ausentes: ${missing.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const rows = parsed.data
    .filter((r) => (r.country ?? "").trim().length > 0)
    .map((r) => ({
      country: (r.country ?? "").trim(),
      beer_servings: toInt(r.beer_servings),
      spirit_servings: toInt(r.spirit_servings),
      wine_servings: toInt(r.wine_servings),
      total_litres_of_pure_alcohol: toFloat(r.total_litres_of_pure_alcohol),
    }));

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "O arquivo não contém linhas válidas." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  // 1) Create the upload batch record.
  const { data: upload, error: uploadError } = await supabaseAdmin
    .from("uploads")
    .insert({
      filename: (file as File).name || "drinks.csv",
      row_count: rows.length,
      uploaded_by: email,
    })
    .select()
    .single();

  if (uploadError || !upload) {
    return NextResponse.json(
      { error: `Erro ao registrar upload: ${uploadError?.message}` },
      { status: 500 }
    );
  }

  // 2) Insert all drink rows linked to this batch.
  const { error: drinksError } = await supabaseAdmin
    .from("drinks")
    .insert(rows.map((r) => ({ ...r, upload_id: upload.id })));

  if (drinksError) {
    // Roll back the batch so we don't leave an empty upload behind.
    await supabaseAdmin.from("uploads").delete().eq("id", upload.id);
    return NextResponse.json(
      { error: `Erro ao salvar dados: ${drinksError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    upload_id: upload.id,
    row_count: rows.length,
  });
}

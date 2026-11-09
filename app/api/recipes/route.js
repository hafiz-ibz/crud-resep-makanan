import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { parseRecipe } from "@/lib/recipe";

export const dynamic = "force-dynamic";

const COLUMNS =
  "id, title, category, cook_time, servings, ingredients, steps, created_at, updated_at";

// GET /api/recipes -> semua resep, terbaru di atas
export async function GET() {
  try {
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM recipes ORDER BY id DESC`);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Koneksi ke database gagal" }, { status: 500 });
  }
}

// POST /api/recipes -> tulis resep baru
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data yang dikirim tidak valid" }, { status: 400 });
  }

  const { data, error } = parseRecipe(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const [result] = await pool.query(
      "INSERT INTO recipes (title, category, cook_time, servings, ingredients, steps) VALUES (?, ?, ?, ?, ?, ?)",
      [data.title, data.category, data.cook_time, data.servings, data.ingredients, data.steps]
    );
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM recipes WHERE id = ?`, [
      result.insertId,
    ]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Resep belum tersimpan, coba lagi" }, { status: 500 });
  }
}

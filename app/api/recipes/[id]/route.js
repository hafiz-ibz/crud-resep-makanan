import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { parseRecipe } from "@/lib/recipe";

export const dynamic = "force-dynamic";

const COLUMNS =
  "id, title, category, cook_time, servings, ingredients, steps, created_at, updated_at";

// Di Next.js 15, `params` berupa Promise dan harus di-await.
async function getId(params) {
  const { id } = await params;
  const num = Number(id);
  return Number.isInteger(num) && num > 0 ? num : null;
}

const badId = () => NextResponse.json({ error: "ID resep tidak valid" }, { status: 400 });
const notFound = () => NextResponse.json({ error: "Resep tidak ditemukan" }, { status: 404 });

// GET /api/recipes/:id -> detail satu resep
export async function GET(_request, { params }) {
  const id = await getId(params);
  if (!id) return badId();

  try {
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM recipes WHERE id = ?`, [id]);
    if (rows.length === 0) return notFound();
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Resep belum bisa dimuat" }, { status: 500 });
  }
}

// PUT /api/recipes/:id -> ubah resep
export async function PUT(request, { params }) {
  const id = await getId(params);
  if (!id) return badId();

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
      "UPDATE recipes SET title = ?, category = ?, cook_time = ?, servings = ?, ingredients = ?, steps = ? WHERE id = ?",
      [data.title, data.category, data.cook_time, data.servings, data.ingredients, data.steps, id]
    );
    if (result.affectedRows === 0) return notFound();
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM recipes WHERE id = ?`, [id]);
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Perubahan belum tersimpan, coba lagi" }, { status: 500 });
  }
}

// DELETE /api/recipes/:id -> hapus resep
export async function DELETE(_request, { params }) {
  const id = await getId(params);
  if (!id) return badId();

  try {
    const [result] = await pool.query("DELETE FROM recipes WHERE id = ?", [id]);
    if (result.affectedRows === 0) return notFound();
    return NextResponse.json({ message: "Resep dihapus" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Resep belum terhapus, coba lagi" }, { status: 500 });
  }
}

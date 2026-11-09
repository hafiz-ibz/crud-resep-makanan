// Dipakai di server (validasi API) dan di client (warna kategori, pilihan form).

export const CATEGORIES = [
  { name: "Nasi & Mie", color: "#E0A100" }, // kunyit
  { name: "Lauk", color: "#C8321E" }, // sambal
  { name: "Sayur", color: "#2F7D4F" }, // pandan
  { name: "Camilan", color: "#D9692A" }, // gorengan
  { name: "Kue", color: "#A9467F" }, // ubi ungu
  { name: "Minuman", color: "#2B7FA8" }, // es teh biru
];

export const categoryColor = (name) =>
  CATEGORIES.find((c) => c.name === name)?.color ?? "#506456";

export const toLines = (value) =>
  String(value ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

// Mengembalikan { data } jika valid, atau { error } berisi pesan untuk pengguna.
export function parseRecipe(body) {
  const title = String(body?.title ?? "").trim();
  const category = String(body?.category ?? "");
  const cook_time = Number(body?.cook_time);
  const servings = Number(body?.servings);
  const ingredients = toLines(body?.ingredients);
  const steps = toLines(body?.steps);

  if (!title) return { error: "Judul resep wajib diisi" };
  if (title.length > 120) return { error: "Judul maksimal 120 karakter" };
  if (!CATEGORIES.some((c) => c.name === category)) {
    return { error: "Pilih salah satu kategori yang tersedia" };
  }
  if (!Number.isInteger(cook_time) || cook_time < 1 || cook_time > 1440) {
    return { error: "Waktu masak harus antara 1 dan 1440 menit" };
  }
  if (!Number.isInteger(servings) || servings < 1 || servings > 100) {
    return { error: "Jumlah porsi harus antara 1 dan 100" };
  }
  if (ingredients.length === 0) return { error: "Tulis minimal satu bahan" };
  if (steps.length === 0) return { error: "Tulis minimal satu langkah" };

  return {
    data: {
      title,
      category,
      cook_time,
      servings,
      ingredients: ingredients.join("\n"),
      steps: steps.join("\n"),
    },
  };
}

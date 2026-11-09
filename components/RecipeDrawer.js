"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, categoryColor, toLines } from "@/lib/recipe";

const emptyForm = {
  title: "",
  category: CATEGORIES[0].name,
  cook_time: "30",
  servings: "2",
  ingredients: "",
  steps: "",
};

export default function RecipeDrawer({ panel, onClose, onEdit, onCancel, onSaved, onDeleted }) {
  const { mode, recipe } = panel;
  const drawerRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const [form, setForm] = useState(() =>
    recipe
      ? {
          title: recipe.title,
          category: recipe.category,
          cook_time: String(recipe.cook_time),
          servings: String(recipe.servings),
          ingredients: recipe.ingredients,
          steps: recipe.steps,
        }
      : emptyForm
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    drawerRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(recipe ? `/api/recipes/${recipe.id}` : "/api/recipes", {
        method: recipe ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resep belum tersimpan, coba lagi");
      onSaved(data, !recipe);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resep belum terhapus, coba lagi");
      onDeleted(recipe);
    } catch (err) {
      setError(err.message);
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        ref={drawerRef}
      >
        <button type="button" className="close" onClick={onClose} aria-label="Tutup panel">
          ×
        </button>

        {mode === "view" ? (
          <article className="view" style={{ "--tab": categoryColor(recipe.category) }}>
            <p className="kind">
              <span className="dot" aria-hidden="true" />
              {recipe.category}
            </p>
            <h2 id="drawer-title">{recipe.title}</h2>

            <dl className="facts">
              <div>
                <dt>Waktu masak</dt>
                <dd>{recipe.cook_time} menit</dd>
              </div>
              <div>
                <dt>Porsi</dt>
                <dd>{recipe.servings} orang</dd>
              </div>
            </dl>

            <h3>Bahan</h3>
            <ul className="ingredients">
              {toLines(recipe.ingredients).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h3>Langkah</h3>
            <ol className="steps">
              {toLines(recipe.steps).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            {confirming ? (
              <div className="confirm" role="alertdialog" aria-label="Konfirmasi hapus">
                <p>Hapus resep “{recipe.title}”? Resep yang dihapus tidak bisa dikembalikan.</p>
                <div className="actions">
                  <button className="btn danger" onClick={remove} disabled={busy}>
                    {busy ? "Menghapus..." : "Ya, hapus"}
                  </button>
                  <button className="btn ghost" onClick={() => setConfirming(false)} disabled={busy}>
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="actions">
                <button className="btn primary" onClick={() => onEdit(recipe)}>
                  Ubah resep
                </button>
                <button className="btn danger-ghost" onClick={() => setConfirming(true)}>
                  Hapus resep
                </button>
              </div>
            )}
          </article>
        ) : (
          <form className="form" onSubmit={submit}>
            <h2 id="drawer-title">{recipe ? "Ubah resep" : "Tulis resep"}</h2>

            <label>
              Judul resep
              <input
                name="title"
                value={form.title}
                onChange={change}
                maxLength={120}
                required
                placeholder="Contoh: Sayur asem Betawi"
              />
            </label>

            <label>
              Kategori
              <select name="category" value={form.category} onChange={change}>
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="row2">
              <label>
                Waktu masak (menit)
                <input
                  name="cook_time"
                  type="number"
                  min="1"
                  max="1440"
                  value={form.cook_time}
                  onChange={change}
                  required
                />
              </label>
              <label>
                Porsi (orang)
                <input
                  name="servings"
                  type="number"
                  min="1"
                  max="100"
                  value={form.servings}
                  onChange={change}
                  required
                />
              </label>
            </div>

            <label>
              Bahan
              <textarea
                name="ingredients"
                rows={6}
                value={form.ingredients}
                onChange={change}
                required
                placeholder={"2 piring nasi putih\n3 siung bawang putih"}
              />
              <small>Satu bahan per baris.</small>
            </label>

            <label>
              Langkah
              <textarea
                name="steps"
                rows={7}
                value={form.steps}
                onChange={change}
                required
                placeholder={"Haluskan bumbu.\nTumis sampai harum."}
              />
              <small>Satu langkah per baris, urut dari awal.</small>
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="actions">
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "Menyimpan..." : recipe ? "Simpan perubahan" : "Simpan resep"}
              </button>
              <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>
                Batal
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RecipeDrawer from "@/components/RecipeDrawer";
import { CATEGORIES, categoryColor, toLines } from "@/lib/recipe";

const FILTERS = ["Semua", ...CATEGORIES.map((c) => c.name)];

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [panel, setPanel] = useState(null); // { mode: "view" | "form", recipe }
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/recipes", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resep belum bisa dimuat");
      setRecipes(data);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => clearTimeout(toastTimer.current);
  }, [load]);

  function notify(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter(
      (r) =>
        (category === "Semua" || r.category === category) &&
        (!q || r.title.toLowerCase().includes(q) || r.ingredients.toLowerCase().includes(q))
    );
  }, [recipes, query, category]);

  const filtering = query.trim() !== "" || category !== "Semua";

  function resetFilter() {
    setQuery("");
    setCategory("Semua");
  }

  const closePanel = useCallback(() => setPanel(null), []);

  return (
    <main className="page">
      <header className="masthead">
        <div>
          <h1>Resep Dapurku</h1>
          <p className="lede">Catat resep yang sering kamu masak, lengkap dengan bahan dan langkahnya.</p>
        </div>
        <button className="btn primary" onClick={() => setPanel({ mode: "form", recipe: null })}>
          Tulis resep
        </button>
      </header>

      <section className="tools" aria-label="Cari dan saring resep">
        <label className="search">
          <span className="sr-only">Cari resep</span>
          <input
            type="search"
            placeholder="Cari judul atau bahan"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="chips" role="group" aria-label="Kategori">
          {FILTERS.map((name) => (
            <button
              key={name}
              type="button"
              className="chip"
              aria-pressed={category === name}
              style={{ "--tab": name === "Semua" ? "var(--ink)" : categoryColor(name) }}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="alert" role="alert">
          <p>
            <strong>Resep belum bisa dimuat.</strong> {error}. Periksa variabel DB_* di
            environment dan pastikan tabel recipes sudah dibuat.
          </p>
          <button className="btn ghost" onClick={load}>
            Coba lagi
          </button>
        </div>
      )}

      {loading && <p className="count">Memuat resep...</p>}

      {!loading && !error && recipes.length === 0 && (
        <section className="empty">
          <h2>Belum ada resep</h2>
          <p>Tulis resep pertamamu, misalnya masakan yang paling sering kamu buat di rumah.</p>
          <button className="btn primary" onClick={() => setPanel({ mode: "form", recipe: null })}>
            Tulis resep
          </button>
        </section>
      )}

      {!loading && recipes.length > 0 && (
        <>
          <p className="count">
            {filtering ? `${visible.length} dari ${recipes.length} resep` : `${recipes.length} resep tersimpan`}
          </p>

          {visible.length === 0 ? (
            <section className="empty">
              <h2>Tidak ada resep yang cocok</h2>
              <p>Coba kata kunci lain atau pilih kategori yang berbeda.</p>
              <button className="btn ghost" onClick={resetFilter}>
                Tampilkan semua resep
              </button>
            </section>
          ) : (
            <ul className="grid">
              {visible.map((r) => {
                const ingredients = toLines(r.ingredients);
                const steps = toLines(r.steps);
                return (
                  <li key={r.id}>
                    <article className="card" style={{ "--tab": categoryColor(r.category) }}>
                      <p className="kind">
                        <span className="dot" aria-hidden="true" />
                        {r.category}
                      </p>
                      <p className="card-time">
                        <b>{r.cook_time}</b> menit
                      </p>
                      <h3>
                        <button
                          type="button"
                          className="card-open"
                          onClick={() => setPanel({ mode: "view", recipe: r })}
                        >
                          {r.title}
                        </button>
                      </h3>
                      <ul className="lines">
                        {ingredients.slice(0, 4).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                      <p className="card-foot">
                        {ingredients.length} bahan, {steps.length} langkah, {r.servings} porsi
                      </p>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {panel && (
        <RecipeDrawer
          key={`${panel.mode}-${panel.recipe?.id ?? "baru"}`}
          panel={panel}
          onClose={closePanel}
          onEdit={(recipe) => setPanel({ mode: "form", recipe })}
          onCancel={() =>
            panel.recipe ? setPanel({ mode: "view", recipe: panel.recipe }) : setPanel(null)
          }
          onSaved={(recipe, created) => {
            setPanel({ mode: "view", recipe });
            notify(created ? "Resep disimpan" : "Perubahan disimpan");
            load();
          }}
          onDeleted={() => {
            setPanel(null);
            notify("Resep dihapus");
            load();
          }}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}

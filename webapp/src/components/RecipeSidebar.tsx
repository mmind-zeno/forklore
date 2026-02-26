"use client";

import Link from "next/link";

type Recipe = {
  id: string;
  title: string;
  imagePath: string | null;
  category: string | null;
  createdAt: Date;
};

export function RecipeSidebar({
  recipes,
  currentId,
  title = "Weitere Rezepte",
}: {
  recipes: Recipe[];
  currentId: string | null;
  title?: string;
}) {
  const filtered = currentId ? recipes.filter((r) => r.id !== currentId) : recipes;
  const display = filtered.slice(0, 5);

  if (display.length === 0) return null;

  return (
    <div className="sticky top-24">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-200/80 shadow-lg p-4">
        <h3 className="font-semibold text-stone-800 mb-3">{title}</h3>
        <ul className="space-y-2">
          {display.map((r) => (
            <li key={r.id}>
              <Link
                href={`/recipe/${r.id}`}
                className="flex gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors group"
              >
                {r.imagePath ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/${r.imagePath}`}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-coral-400/20 to-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                    🍳
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-800 truncate group-hover:text-coral-600 transition-colors">
                    {r.title}
                  </p>
                  <p className="text-xs text-stone-500">
                    {r.category === "backen" ? "🥐 Backen" : r.category === "kochen" ? "🍲 Kochen" : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/"
          className="mt-3 block text-center text-sm text-coral-600 hover:text-coral-500 font-medium"
        >
          Alle Rezepte →
        </Link>
      </div>
    </div>
  );
}

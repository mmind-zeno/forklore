"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

function getCategoryEmoji(category: string | null): string {
  const map: Record<string, string> = {
    backen: "🥐",
    kochen: "🍳",
    vegan: "🌿",
  };
  return (category && map[category]) ?? "🍽️";
}

function getCategoryLabel(category: string | null): string {
  if (!category) return "";
  if (category === "backen") return "Backen";
  if (category === "kochen") return "Kochen";
  return category;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Recipe = {
  id: string;
  title: string;
  imagePath: string | null;
  category: string | null;
  createdAt: Date;
  ownerName?: string | null;
  ownerId?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
};

export function RecipeSidebar({
  recipes,
  currentId,
  title = "Weitere Rezepte",
  backHref = "/",
}: {
  recipes: Recipe[];
  currentId: string | null;
  title?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const filtered = currentId ? recipes.filter((r) => r.id !== currentId) : recipes;
  const display = filtered.slice(0, 5);

  if (display.length === 0) return null;

  return (
    <div className="lg:sticky lg:top-24 self-start">
      <div className="bg-warmwhite rounded-2xl border border-espresso/6 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-espresso/6 bg-gradient-to-r from-cream to-warmwhite">
          <h2 className="font-display italic text-lg text-espresso">✦ {title}</h2>
        </div>
        <ul>
          {display.map((r) => (
            <li key={r.id}>
              <Link
                href={`/recipe/${r.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-cream/70 transition-colors duration-150 border-b border-espresso/4 last:border-0 group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-cream-dark">
                  {r.imagePath ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/uploads/${r.imagePath}`}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream-dark to-cream text-2xl">
                      {getCategoryEmoji(r.category)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold text-sm text-espresso truncate group-hover:text-terra transition-colors duration-150">
                    {r.title}
                  </p>
                  <p className="text-[11px] text-espresso-light mt-0.5">
                    {(r.ownerName ?? r.ownerId) && (
                      <>
                        Geteilt von{" "}
                        {r.ownerId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/?owner=${encodeURIComponent(r.ownerId!)}${r.ownerName ? `&ownerName=${encodeURIComponent(r.ownerName)}` : ""}`);
                            }}
                            className="font-bold text-terra hover:underline text-left"
                          >
                            {r.ownerName ?? "Unbekannt"}
                          </button>
                        ) : (
                          <span className="font-medium">{r.ownerName}</span>
                        )}
                        {" · "}
                      </>
                    )}
                    {getCategoryLabel(r.category)} · {formatDate(r.createdAt)}
                    {(r.ratingCount ?? 0) > 0 && (
                      <> · ★ {(r.ratingAverage ?? 0).toFixed(1)} ({r.ratingCount})</>
                    )}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-terra opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity duration-150"
                />
              </Link>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3.5 bg-cream/50 border-t border-espresso/6">
          <Link
            href={backHref}
            className="text-terra font-bold text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all duration-200"
          >
            Alle Rezepte
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

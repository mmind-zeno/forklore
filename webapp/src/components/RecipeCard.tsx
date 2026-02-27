"use client";

import Link from "next/link";
import { ArrowRight, Pencil } from "lucide-react";

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

type Recipe = {
  id: string;
  title: string;
  imagePath: string | null;
  category: string | null;
  tags: string | null;
  createdAt: Date;
};

export function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  return (
    <article
      className={`group relative bg-warmwhite rounded-2xl overflow-hidden border border-espresso/5 shadow-sm
        transition-all duration-300 hover:-translate-y-2 hover:shadow-hover hover:border-terra/20 reveal`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {/* Quick edit button */}
      <Link
        href={`/edit/${recipe.id}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Rezept bearbeiten"
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-warmwhite/90 backdrop-blur-sm border border-espresso/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-terra hover:text-white hover:border-terra transition-all duration-200 shadow-sm"
      >
        <Pencil size={13} />
      </Link>
      <Link href={`/recipe/${recipe.id}`} className="block cursor-pointer">
      {/* Image area */}
      <div className="relative overflow-hidden h-52">
        {recipe.imagePath ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${recipe.imagePath}`}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white font-body font-bold text-sm">Rezept ansehen →</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cream-dark via-cream to-warmwhite flex flex-col items-center justify-center gap-3">
            <span className="text-5xl opacity-60 select-none">{getCategoryEmoji(recipe.category)}</span>
            <span className="font-display italic text-espresso-light text-sm text-center px-4 max-w-[160px] leading-snug opacity-70 line-clamp-2">
              {recipe.title}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-espresso-light/50 font-bold">
              Kein Bild hochgeladen
            </span>
          </div>
        )}
        {/* Category + Tags badges */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
          {recipe.category && (
            <span className="bg-warmwhite/90 backdrop-blur-sm text-espresso font-bold text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5">
              {getCategoryEmoji(recipe.category)} {getCategoryLabel(recipe.category)}
            </span>
          )}
          {recipe.tags && (() => {
            let tagList: string[] = [];
            try {
              const t = JSON.parse(recipe.tags) as string[];
              if (Array.isArray(t)) tagList = t;
            } catch {
              // ignore
            }
            const isVegan = tagList.some((x) => x.toLowerCase() === "vegan");
            return isVegan ? (
              <span className="bg-sage/90 backdrop-blur-sm text-white font-bold text-[11px] px-2.5 py-1 rounded-full">
                🌱 Vegan
              </span>
            ) : null;
          })()}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <h3 className="font-display text-lg text-espresso leading-snug mb-2 group-hover:text-terra transition-colors duration-200">
          {recipe.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-espresso-light font-bold uppercase tracking-wide">
              {getCategoryLabel(recipe.category) || "—"}
            </span>
            <span className="text-espresso-light/30 text-xs">·</span>
            <span className="text-[11px] text-espresso-light">
              {new Date(recipe.createdAt).toLocaleDateString("de-DE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <ArrowRight
            size={14}
            className="text-terra opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
          />
        </div>
      </div>
      </Link>
    </article>
  );
}

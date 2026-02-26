"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, type: "spring", stiffness: 100 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/recipe/${recipe.id}`}
        className="block rounded-2xl overflow-hidden bg-white border border-stone-200/80 shadow-lg hover:shadow-xl hover:shadow-coral-500/10 hover:border-coral-400/40 transition-all duration-300 group"
      >
        {recipe.imagePath ? (
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${recipe.imagePath}`}
              alt={recipe.title}
              className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-coral-400/25 via-amber-100 to-teal-200/30 flex items-center justify-center text-stone-500 text-5xl group-hover:scale-105 transition-transform">
            🍳
          </div>
        )}
        <div className="p-4">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {recipe.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {recipe.category === "backen" ? "🥐 Backen" : "🍲 Kochen"}
              </span>
            )}
            {recipe.tags && (() => {
              try {
                const tags = JSON.parse(recipe.tags) as string[];
                return tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {t}
                  </span>
                ));
              } catch {
                return null;
              }
            })()}
          </div>
          <h2 className="font-semibold text-stone-800 group-hover:text-coral-600 transition-colors">
            {recipe.title}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {new Date(recipe.createdAt).toLocaleDateString("de-DE", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

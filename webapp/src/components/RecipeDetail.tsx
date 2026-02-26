"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { RecipeSidebar } from "./RecipeSidebar";

type RelatedRecipe = {
  id: string;
  title: string;
  imagePath: string | null;
  category: string | null;
  createdAt: Date;
};

type RecipeDetailProps = {
  title: string;
  imagePath: string | null;
  ingredients: Array<{ amount?: string; unit?: string; name: string }>;
  steps: string[];
  relatedRecipes?: RelatedRecipe[];
  currentId?: string;
};

export function RecipeDetail({ title, imagePath, ingredients, steps, relatedRecipes = [], currentId }: RecipeDetailProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/90 via-teal-50/40 to-rose-50/60 pb-24">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-stone-200/60 px-4 py-3 shadow-sm">
        <Link
          href="/"
          className="text-coral-600 hover:text-coral-500 font-medium text-sm inline-flex items-center gap-1 transition-colors"
        >
          ← Zurück
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-8">
        <main className="flex-1 min-w-0 p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {imagePath ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl overflow-hidden shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/${imagePath}`}
                alt={title}
                className="w-full max-h-72 object-cover"
              />
            </motion.div>
          ) : (
            <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-coral-400/25 via-amber-100 to-teal-200/30 flex items-center justify-center text-6xl">
              🍳
            </div>
          )}

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-stone-800"
          >
            {title}
          </motion.h1>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 rounded-xl p-4 shadow-sm border border-stone-100"
          >
            <h2 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <span className="text-coral-500">▸</span> Zutaten
            </h2>
            <ul className="space-y-2 text-stone-600">
              {ingredients.map((i, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-coral-400">•</span>
                  <span>
                    {i.amount && `${i.amount} `}
                    {i.unit && `${i.unit} `}
                    {i.name}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 rounded-xl p-4 shadow-sm border border-stone-100"
          >
            <h2 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <span className="text-coral-500">▸</span> Zubereitung
            </h2>
            <ol className="space-y-3 text-stone-600">
              {steps.map((s, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-coral-100 text-coral-700 text-sm font-medium flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </motion.section>
        </motion.div>
      </main>
      {relatedRecipes.length > 0 && currentId && (
        <aside className="lg:w-72 flex-shrink-0 py-6">
          <RecipeSidebar recipes={relatedRecipes} currentId={currentId} title="Weitere Rezepte" />
        </aside>
      )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecipeSidebar } from "./RecipeSidebar";
import { Printer, Share2, Pencil, Trash2, Loader2, Globe2, Lock } from "lucide-react";
import { deleteRecipe } from "@/app/actions/delete-recipe";
import { rateRecipe } from "@/app/actions/rate-recipe";

type RelatedRecipe = {
  id: string;
  title: string;
  imagePath: string | null;
  category: string | null;
  createdAt: Date;
};

type RecipeDetailProps = {
  recipeId: string;
  title: string;
  imagePath: string | null;
  ingredients: Array<{ amount?: string; unit?: string; name: string }>;
  steps: string[];
  tags?: string[] | null;
  category?: string | null;
  relatedRecipes?: RelatedRecipe[];
  currentId?: string;
  visibility?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
  initialUserRating?: number;
};

function getCategoryLabel(cat: string | null): string {
  if (!cat) return "";
  if (cat === "backen") return "Backen";
  if (cat === "kochen") return "Kochen";
  return cat;
}

export function RecipeDetail({
  recipeId,
  title,
  imagePath,
  ingredients,
  steps,
  tags = [],
  category,
  relatedRecipes = [],
  currentId,
  visibility,
  ratingAverage = 0,
  ratingCount = 0,
  initialUserRating = 0,
}: RecipeDetailProps) {
  const tagList = Array.isArray(tags) ? tags : [];
  const isVegan = tagList.some((t) => t.toLowerCase() === "vegan");
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [userRating, setUserRating] = useState(initialUserRating);
  const [avgRating, setAvgRating] = useState(ratingAverage);
  const [ratingCountState, setRatingCountState] = useState(ratingCount);
  const [ratingError, setRatingError] = useState("");
  const [isRating, setIsRating] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    const result = await deleteRecipe(recipeId);
    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setDeleteError(result.error || "Fehler beim Löschen");
      setIsDeleting(false);
    }
  };

  const handleRate = async (value: number) => {
    setIsRating(true);
    setRatingError("");
    const result = await rateRecipe(recipeId, value);
    if (result.success && typeof result.average === "number" && typeof result.count === "number" && typeof result.stars === "number") {
      setUserRating(result.stars);
      setAvgRating(result.average);
      setRatingCountState(result.count);
    } else {
      setRatingError(result.error || "Bewertung fehlgeschlagen.");
    }
    setIsRating(false);
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur-xl border-b border-espresso/6 px-6 py-3 shadow-soft">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-terra hover:text-terra-dark font-bold text-sm inline-flex items-center gap-1 transition-colors"
          >
            ← Zurück
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors"
              aria-label="Rezept löschen"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Löschen</span>
            </button>
            <Link
              href={`/edit/${recipeId}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-espresso/20 text-espresso text-sm font-bold hover:bg-cream transition-colors"
            >
              <Pencil size={16} />
              Bearbeiten
            </Link>
          </div>
        </div>
      </header>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-display text-xl font-bold text-espresso mb-2">Rezept löschen?</h3>
            <p className="text-espresso-mid mb-2">Das Rezept <strong>&bdquo;{title}&ldquo;</strong> wird unwiderruflich gelöscht.</p>
            {deleteError && <p className="text-red-600 text-sm mb-3">{deleteError}</p>}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl border border-espresso/20 text-espresso font-bold hover:bg-cream-dark transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={16} /> Löschen</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-col lg:flex-row gap-8">
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Hero Image */}
            {imagePath ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl overflow-hidden shadow-card border border-espresso/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/uploads/${imagePath}`}
                  alt={title}
                  className="w-full max-h-80 object-cover"
                />
              </motion.div>
            ) : (
              <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-cream-dark via-cream to-warmwhite flex items-center justify-center text-6xl border border-espresso/5">
                🍳
              </div>
            )}

            {/* Title + Meta */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {category && (
                  <span className="px-3 py-1 rounded-full bg-espresso/10 text-espresso font-bold text-sm">
                    {getCategoryLabel(category)}
                  </span>
                )}
                {isVegan && (
                  <span className="px-3 py-1 rounded-full bg-sage/20 text-sage-dark font-bold text-sm">
                    🌱 Vegan
                  </span>
                )}
                {visibility === "public" && (
                  <span className="px-3 py-1 rounded-full bg-honey-light/30 text-espresso font-bold text-sm flex items-center gap-1.5">
                    <Globe2 size={14} /> Für alle sichtbar
                  </span>
                )}
                {(!visibility || visibility === "private") && (
                  <span className="px-3 py-1 rounded-full bg-espresso/5 text-espresso-mid font-bold text-sm flex items-center gap-1.5">
                    <Lock size={14} /> Privat
                  </span>
                )}
                {tagList
                  .filter((t) => t.toLowerCase() !== "vegan")
                  .map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-cream-dark/60 text-espresso-mid text-sm">
                      {t}
                    </span>
                  ))}
              </div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-display text-3xl md:text-4xl font-bold text-espresso leading-tight"
              >
                {title}
              </motion.h1>
              <div className="mt-3 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(star)}
                    disabled={isRating}
                    className={`text-lg ${
                      star <= userRating ? "text-terra" : "text-espresso-light"
                    } hover:scale-110 transition-transform`}
                    aria-label={`${star} Sterne geben`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm text-espresso-mid">
                  {avgRating.toFixed(1)} · {ratingCountState} Bewertung
                  {ratingCountState === 1 ? "" : "en"}
                </span>
              </div>
              {ratingError && <p className="text-xs text-red-500 mt-1">{ratingError}</p>}
            </div>

            {/* Ingredients – Sage Box */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-sage/10 rounded-2xl p-6 border border-sage/20"
            >
              <h2 className="font-display text-lg font-bold text-sage-dark mb-4 flex items-center gap-2">
                <span>▸</span> Zutaten
              </h2>
              <ul className="space-y-2 text-espresso-mid">
                {ingredients.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sage">•</span>
                    <span>
                      {i.amount && `${i.amount} `}
                      {i.unit && `${i.unit} `}
                      {i.name}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Steps – Terra Circles */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-warmwhite rounded-2xl p-6 border border-espresso/6 shadow-sm"
            >
              <h2 className="font-display text-lg font-bold text-espresso mb-4 flex items-center gap-2">
                <span>▸</span> Zubereitung
              </h2>
              <ol className="space-y-4">
                {steps.map((s, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-terra text-white text-sm font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-espresso-mid leading-relaxed pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </motion.section>

          </motion.div>
        </main>

        {/* Sidebar: Print, Share, Related */}
        <aside className="lg:w-72 flex-shrink-0 space-y-6">
          <div className="bg-warmwhite rounded-2xl border border-espresso/6 p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-espresso text-cream text-sm font-bold hover:bg-espresso/90 transition-colors"
              >
                <Printer size={16} />
                Drucken
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title,
                      url: window.location.href,
                      text: title,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-espresso/20 text-espresso text-sm font-bold hover:bg-cream transition-colors"
              >
                <Share2 size={16} />
                Teilen
              </button>
            </div>
          </div>

          {relatedRecipes.length > 0 && currentId && (
            <RecipeSidebar
              recipes={relatedRecipes}
              currentId={currentId}
              title="Weitere Rezepte"
              backHref={category ? `/?category=${category}` : "/"}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

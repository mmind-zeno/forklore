import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RecipeCard } from "@/components/RecipeCard";
import { HeaderWithAuth } from "@/components/HeaderWithAuth";
import { RecipeSidebar } from "@/components/RecipeSidebar";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ category?: string }> };

export default async function HomePage({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const filter = category === "backen" || category === "kochen" ? { category } : {};

  let recipes: Awaited<ReturnType<typeof prisma.recipe.findMany>> = [];
  let backenCount = 0;
  let kochenCount = 0;
  let sidebarRecipes: Awaited<ReturnType<typeof prisma.recipe.findMany>> = [];

  try {
    [recipes, backenCount, kochenCount, sidebarRecipes] = await Promise.all([
      prisma.recipe.findMany({ where: filter, orderBy: { createdAt: "desc" } }),
      prisma.recipe.count({ where: { category: "backen" } }),
      prisma.recipe.count({ where: { category: "kochen" } }),
      prisma.recipe.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    ]);
  } catch {
    // Fallback: category/tags columns may not exist on older DB – show empty until migration runs
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/90 via-teal-50/40 to-rose-50/60">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral-400/15 via-amber-200/20 to-teal-300/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-coral-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-soft" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/25 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-rose-300/20 rounded-full blur-3xl" />
        <div className="relative">
          <HeaderWithAuth />
        </div>
      </header>

      <main className="p-4 pb-24 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {recipes.length === 0 ? (
              <div className="space-y-8">
                <div className="rounded-2xl border-2 border-dashed border-coral-400/50 bg-white/70 p-12 text-center shadow-lg">
                  <p className="text-6xl mb-4">🍽️</p>
                  <h2 className="text-xl font-bold text-stone-800 mb-2">Willkommen bei Forklore</h2>
                  <p className="text-stone-600 mb-6 max-w-md mx-auto">
                    Deine Rezepte – schnell erfasst, strukturiert gespeichert. Schreib eine Notiz oder sprich dein erstes Rezept ein.
                  </p>
                  <Link
                    href="/add"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-coral-500 to-coral-600 px-6 py-3 text-white font-semibold shadow-lg shadow-coral-500/30 transition-all hover:shadow-coral-500/40 hover:scale-105 active:scale-95"
                  >
                    Erstes Rezept hinzufügen →
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white/80 rounded-xl p-5 border border-stone-200/80 shadow-sm">
                    <span className="text-2xl font-bold text-coral-500">✏️</span>
                    <h3 className="font-semibold text-stone-800 mt-2">Notiz-Modus</h3>
                    <p className="text-sm text-stone-600 mt-1">Rezept als Text schreiben, optional mit Foto. Die KI extrahiert Zutaten und Schritte.</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-5 border border-stone-200/80 shadow-sm">
                    <span className="text-2xl font-bold text-coral-500">🎤</span>
                    <h3 className="font-semibold text-stone-800 mt-2">Mikrofon-Modus</h3>
                    <p className="text-sm text-stone-600 mt-1">Foto vom Essen + Rezept sprechen. Whisper transkribiert, GPT-4o strukturiert.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-700">Deine Rezepte</h2>
                    <p className="text-sm text-stone-500">{recipes.length} Rezept{recipes.length !== 1 ? "e" : ""} gespeichert</p>
                  </div>
                  <Link
                    href="/add"
                    className="text-sm text-coral-600 hover:text-coral-500 font-medium transition-colors"
                  >
                    + Neues Rezept
                  </Link>
                </div>

                <div className="flex gap-2 mb-6">
                  <Link
                    href="/"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !category ? "bg-coral-500 text-white" : "bg-white/80 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    Alle
                  </Link>
                  <Link
                    href="/?category=backen"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      category === "backen" ? "bg-amber-500 text-white" : "bg-white/80 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    🥐 Backen ({backenCount})
                  </Link>
                  <Link
                    href="/?category=kochen"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      category === "kochen" ? "bg-teal-500 text-white" : "bg-white/80 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    🍲 Kochen ({kochenCount})
                  </Link>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {recipes.map((r, i) => (
                    <RecipeCard key={r.id} recipe={r} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>

          {recipes.length > 0 && sidebarRecipes.length > 0 && (
            <aside className="lg:w-72 flex-shrink-0">
              <RecipeSidebar recipes={sidebarRecipes} currentId={null} title="Zuletzt hinzugefügt" />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

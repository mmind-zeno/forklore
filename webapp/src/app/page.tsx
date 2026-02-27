import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RecipeCard } from "@/components/RecipeCard";
import { HeaderWithSuspense } from "@/components/HeaderWithSuspense";
import { RecipeSidebar } from "@/components/RecipeSidebar";
import { VeganFilterToggle } from "@/components/VeganFilterToggle";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ category?: string; vegan?: string }> };

export default async function HomePage({ searchParams }: PageProps) {
  const { category, vegan } = await searchParams;
  const filterVegan = vegan === "true";
  const baseFilter = category === "backen" || category === "kochen" ? { category } : {};
  const veganFilter = filterVegan ? { tags: { contains: "vegan" } } : {};
  const filter = { ...baseFilter, ...veganFilter };

  let recipes: Awaited<ReturnType<typeof prisma.recipe.findMany>> = [];
  let totalCount = 0;
  let backenCount = 0;
  let kochenCount = 0;
  let sidebarRecipes: Awaited<ReturnType<typeof prisma.recipe.findMany>> = [];

  try {
    [recipes, totalCount, backenCount, kochenCount, sidebarRecipes] = await Promise.all([
      prisma.recipe.findMany({ where: filter, orderBy: { createdAt: "desc" } }),
      prisma.recipe.count(),
      prisma.recipe.count({ where: { category: "backen" } }),
      prisma.recipe.count({ where: { category: "kochen" } }),
      prisma.recipe.findMany({ where: baseFilter, orderBy: { createdAt: "desc" }, take: 6 }),
    ]);
  } catch (err) {
    console.error("HomePage DB error:", err);
  }

  return (
    <div className="min-h-screen bg-cream">
      <HeaderWithSuspense />

      <main className="pt-24 px-6 py-8 pb-24 max-w-6xl mx-auto">
        {/* Hero – nur wenn Rezepte vorhanden */}
        {recipes.length > 0 && (
          <section className="mb-10 reveal">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-espresso leading-tight">
                  Willkommen in meiner Küche
                </h1>
                <p className="mt-4 text-espresso-mid text-lg max-w-lg">
                  Deine Rezepte – schnell erfasst, strukturiert gespeichert. Schreib eine Notiz oder sprich dein nächstes Rezept ein.
                </p>
                <div className="mt-6 flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥐</span>
                    <span className="font-bold text-espresso">{backenCount}</span>
                    <span className="text-espresso-light text-sm">Backen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🍳</span>
                    <span className="font-bold text-espresso">{kochenCount}</span>
                    <span className="text-espresso-light text-sm">Kochen</span>
                  </div>
                </div>
              </div>
              <div className="relative h-48 lg:h-64 rounded-2xl overflow-hidden bg-gradient-hero border border-espresso/5 shadow-soft">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl md:text-8xl opacity-40">🍴</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {/* Page Header + Filter Tabs */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-espresso">
                  Deine Rezepte
                </h2>
                <p className="text-sm text-espresso-light mt-0.5">
                  ✦ Meine Sammlung · <span className="font-bold text-terra">{recipes.length}</span> Rezept{recipes.length !== 1 ? "e" : ""}
                </p>
              </div>
              <Link
                href="/add"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 text-white text-sm font-bold shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all"
              >
                + Neues Rezept
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={filterVegan ? "/?vegan=true" : "/"}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                    !category
                      ? "bg-gradient-cta text-white shadow-card"
                      : "border border-espresso/10 bg-warmwhite text-espresso-mid hover:border-terra/30 hover:text-terra"
                  }`}
                >
                  Alle ({totalCount})
                </Link>
                <Link
                  href={filterVegan ? "/?category=backen&vegan=true" : "/?category=backen"}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
                    category === "backen"
                      ? "bg-gradient-cta text-white shadow-card"
                      : "border border-espresso/10 bg-warmwhite text-espresso-mid hover:border-terra/30 hover:text-terra"
                  }`}
                >
                  🥐 Backen ({backenCount})
                </Link>
                <Link
                  href={filterVegan ? "/?category=kochen&vegan=true" : "/?category=kochen"}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
                    category === "kochen"
                      ? "bg-gradient-cta text-white shadow-card"
                      : "border border-espresso/10 bg-warmwhite text-espresso-mid hover:border-terra/30 hover:text-terra"
                  }`}
                >
                  🍳 Kochen ({kochenCount})
                </Link>
              </div>
              <Suspense fallback={null}>
                <VeganFilterToggle />
              </Suspense>
            </div>

            {recipes.length === 0 ? (
              /* Empty State */
              <div className="reveal rounded-2xl bg-warmwhite border border-espresso/6 p-12 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-4 text-4xl">
                  {filterVegan ? "🌱" : category === "backen" ? "🥐" : category === "kochen" ? "🍳" : "🍽️"}
                </div>
                <h2 className="font-display text-xl font-bold text-espresso mb-2">
                  {filterVegan
                    ? "Keine veganen Rezepte"
                    : !category
                      ? "Noch keine Rezepte"
                      : `Noch keine ${category === "backen" ? "Back" : "Koch"}rezepte`}
                </h2>
                <p className="text-espresso-light mb-6 max-w-sm mx-auto">
                  {filterVegan
                    ? "Schalte den Vegan-Filter aus oder füge ein veganes Rezept hinzu."
                    : category
                      ? `Füge dein erstes ${category === "backen" ? "Back" : "Koch"}rezept hinzu.`
                      : "Schreib eine Notiz oder sprich dein erstes Rezept ein."}
                </p>
                <Link
                  href="/add"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-6 py-3 text-white font-bold shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all"
                >
                  Erstes Rezept hinzufügen →
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recipes.map((r, i) => (
                    <RecipeCard key={r.id} recipe={r} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>

          {recipes.length > 0 && sidebarRecipes.length > 0 && (
            <aside className="lg:w-72 flex-shrink-0">
              <RecipeSidebar
                recipes={sidebarRecipes}
                currentId={null}
                title="Zuletzt hinzugefügt"
                backHref={
                  (() => {
                    const p = new URLSearchParams();
                    if (category) p.set("category", category);
                    if (filterVegan) p.set("vegan", "true");
                    const q = p.toString();
                    return q ? `/?${q}` : "/";
                  })()
                }
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { HeaderWithSuspense } from "@/components/HeaderWithSuspense";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeSidebar } from "@/components/RecipeSidebar";
import { VeganFilterToggle } from "@/components/VeganFilterToggle";
import { RecipeSearchBar } from "@/components/RecipeSearchBar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    category?: string;
    vegan?: string;
    q?: string;
    main?: string;
    owner?: string;
    ownerName?: string;
  }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const { category, vegan, q, main, owner } = await searchParams;
  const filterVegan = vegan === "true";
  const baseFilter = category === "backen" || category === "kochen" ? { category } : {};
  const veganFilter = filterVegan ? { tags: { contains: "vegan" } } : {};
  const searchQuery = (q ?? "").trim();
  const mainIngredient = (main ?? "").trim().toLowerCase();
  const ownerId = (owner ?? "").trim() || null;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  // Sichtbarkeits-Filter:
  // - eingeloggte User: eigene Rezepte + alle öffentlichen
  // - Gäste: nur öffentliche Rezepte
  const baseVisibilityWhere =
    userId != null
      ? {
          OR: [{ userId }, { visibility: "public" }],
        }
      : { visibility: "public" };

  // Wenn nach einem bestimmten User gefiltert wird, nur dessen öffentliche Rezepte anzeigen.
  const visibilityWhere = ownerId
    ? { userId: ownerId, visibility: "public" }
    : baseVisibilityWhere;

  const searchTerms =
    searchQuery.length > 0
      ? searchQuery
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const searchWhere =
    searchTerms.length > 0
      ? {
          AND: searchTerms.map((term) => ({
            OR: [
              { title: { contains: term } },
              { ingredients: { contains: term } },
              { tags: { contains: term } },
            ],
          })),
        }
      : {};

  const mainTerms =
    mainIngredient.length > 0
      ? mainIngredient
          .split(/[,\s]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

  const mainWhere =
    mainTerms.length > 0
      ? {
          AND: mainTerms.map((term) => ({
            OR: [
              { mainIngredients: { contains: term } },
              { ingredients: { contains: term } },
            ],
          })),
        }
      : {};

  const recipeWhere = {
    ...visibilityWhere,
    ...baseFilter,
    ...veganFilter,
    ...searchWhere,
    ...mainWhere,
  };

  let recipes: Awaited<ReturnType<typeof prisma.recipe.findMany>> = [];
  let totalCount = 0;
  let backenCount = 0;
  let kochenCount = 0;
  let sidebarRecipes: Awaited<ReturnType<typeof prisma.recipe.findMany>> = [];

  try {
    [recipes, totalCount, backenCount, kochenCount, sidebarRecipes] = await Promise.all([
      prisma.recipe.findMany({
        where: recipeWhere,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.recipe.count({ where: visibilityWhere }),
      prisma.recipe.count({ where: { ...visibilityWhere, category: "backen" } }),
      prisma.recipe.count({ where: { ...visibilityWhere, category: "kochen" } }),
      prisma.recipe.findMany({
        where: { ...visibilityWhere, ...baseFilter },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);
  } catch (err) {
    console.error("HomePage DB error:", err);
  }

  const recipeIds = Array.from(
    new Set([...recipes.map((r) => r.id), ...sidebarRecipes.map((r) => r.id)])
  );
  const ratingAggs =
    recipeIds.length > 0
      ? await prisma.rating.groupBy({
          by: ["recipeId"],
          where: { recipeId: { in: recipeIds } },
          _avg: { stars: true },
          _count: { stars: true },
        })
      : [];
  const ratingByRecipe = new Map(
    ratingAggs.map((a) => [
      a.recipeId,
      { avg: a._avg.stars ?? 0, count: a._count.stars ?? 0 },
    ])
  );

  type RecipeWithUser = (typeof recipes)[number] & {
    user?: { id: string; name: string | null; email: string | null } | null;
  };
  const recipesWithMeta = (recipes as RecipeWithUser[]).map((r) => ({
    id: r.id,
    title: r.title,
    imagePath: r.imagePath,
    category: r.category,
    tags: r.tags,
    createdAt: r.createdAt,
    ownerName: r.user?.name ?? r.user?.email ?? null,
    ownerId: r.userId ?? null,
    ratingAverage: ratingByRecipe.get(r.id)?.avg ?? 0,
    ratingCount: ratingByRecipe.get(r.id)?.count ?? 0,
  }));

  const sidebarRecipesWithMeta = (sidebarRecipes as RecipeWithUser[]).map((r) => ({
    id: r.id,
    title: r.title,
    imagePath: r.imagePath,
    category: r.category,
    createdAt: r.createdAt,
    ownerName: r.user?.name ?? r.user?.email ?? null,
    ownerId: r.userId ?? null,
    ratingAverage: ratingByRecipe.get(r.id)?.avg ?? 0,
    ratingCount: ratingByRecipe.get(r.id)?.count ?? 0,
  }));

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

            <RecipeSearchBar />

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
                  {recipesWithMeta.map((r, i) => (
                    <RecipeCard key={r.id} recipe={r} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>

          {recipes.length > 0 && sidebarRecipes.length > 0 && (
            <aside className="lg:w-72 flex-shrink-0">
              <RecipeSidebar
                recipes={sidebarRecipesWithMeta}
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

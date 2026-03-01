import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditRecipeForm } from "@/components/EditRecipeForm";
import { HeaderWithSuspense } from "@/components/HeaderWithSuspense";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) notFound();

  const isOwner = viewerId != null && recipe.userId === viewerId;
  const isAdmin = session?.user?.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    notFound();
  }

  let ingredients: Array<{ amount?: string; unit?: string; name: string }>;
  let steps: string[];
  let tags: string[] = [];
  let mainIngredientsText = "";
  try {
    ingredients = JSON.parse(recipe.ingredients) as Array<{ amount?: string; unit?: string; name: string }>;
    steps = JSON.parse(recipe.steps) as string[];
    if (recipe.tags) {
      const t = JSON.parse(recipe.tags) as string[];
      if (Array.isArray(t)) tags = t;
    }
    if (recipe.mainIngredients) {
      const mi = JSON.parse(recipe.mainIngredients) as string[];
      if (Array.isArray(mi)) {
        mainIngredientsText = mi.join(", ");
      }
    }
  } catch {
    ingredients = [{ name: "Zutat" }];
    steps = ["Schritt"];
  }

  return (
    <div className="min-h-screen bg-cream">
      <HeaderWithSuspense />
      <main className="pt-24 p-6 pb-24 max-w-xl mx-auto">
        <header className="mb-6">
          <Link
            href={`/recipe/${id}`}
            className="text-terra hover:text-terra-dark font-bold transition-colors inline-flex items-center gap-1"
          >
            ← Zurück zum Rezept
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-espresso">
            Rezept bearbeiten
          </h1>
          <p className="text-espresso-mid mt-1">
            Änderungen speichern oder Rezept löschen.
          </p>
        </header>

        <EditRecipeForm
          recipeId={id}
          initialTitle={recipe.title}
          initialIngredients={ingredients}
          initialSteps={steps}
          initialCategory={recipe.category}
          initialTags={tags}
          initialImagePath={recipe.imagePath}
          initialVisibility={recipe.visibility}
          initialMainIngredients={mainIngredientsText}
          initialServings={recipe.servings ?? 4}
        />
      </main>
    </div>
  );
}

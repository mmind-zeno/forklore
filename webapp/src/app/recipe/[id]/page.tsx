import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/RecipeDetail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) notFound();

  // Zugriffsschutz: nur eigene Rezepte oder öffentliche Rezepte anzeigen.
  const isOwner = viewerId != null && recipe.userId === viewerId;
  const isPublic = recipe.visibility === "public";
  if (!isOwner && !isPublic) {
    notFound();
  }

  const relatedFilterBase =
    recipe.category != null
      ? { category: recipe.category, id: { not: id } }
      : { id: { not: id } };

  const visibilityWhere =
    viewerId != null
      ? {
          OR: [{ userId: viewerId }, { visibility: "public" }],
        }
      : { visibility: "public" };

  const relatedRecipes = await prisma.recipe.findMany({
    where: {
      ...relatedFilterBase,
      ...visibilityWhere,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  let ingredients: Array<{ amount?: string; unit?: string; name: string }>;
  let steps: string[];
  let tags: string[] = [];
  try {
    ingredients = JSON.parse(recipe.ingredients) as Array<{ amount?: string; unit?: string; name: string }>;
    steps = JSON.parse(recipe.steps) as string[];
    if (recipe.tags) {
      const t = JSON.parse(recipe.tags) as string[];
      if (Array.isArray(t)) tags = t;
    }
  } catch {
    ingredients = [{ name: "Zutaten konnten nicht geladen werden." }];
    steps = ["Schritte konnten nicht geladen werden."];
  }

  return (
    <RecipeDetail
      recipeId={id}
      title={recipe.title}
      imagePath={recipe.imagePath}
      ingredients={ingredients}
      steps={steps}
      tags={tags}
      category={recipe.category}
      visibility={recipe.visibility}
      relatedRecipes={relatedRecipes}
      currentId={id}
    />
  );
}

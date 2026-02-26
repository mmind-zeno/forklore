import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/RecipeDetail";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) notFound();

  const relatedFilter = recipe.category
    ? { category: recipe.category, id: { not: id } }
    : { id: { not: id } };
  const relatedRecipes = await prisma.recipe.findMany({
    where: relatedFilter,
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  let ingredients: Array<{ amount?: string; unit?: string; name: string }>;
  let steps: string[];
  try {
    ingredients = JSON.parse(recipe.ingredients) as Array<{ amount?: string; unit?: string; name: string }>;
    steps = JSON.parse(recipe.steps) as string[];
  } catch {
    ingredients = [{ name: "Zutaten konnten nicht geladen werden." }];
    steps = ["Schritte konnten nicht geladen werden."];
  }

  return (
    <RecipeDetail
      title={recipe.title}
      imagePath={recipe.imagePath}
      ingredients={ingredients}
      steps={steps}
      relatedRecipes={relatedRecipes}
      currentId={id}
    />
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) notFound();

  const ingredients = JSON.parse(recipe.ingredients) as Array<{
    amount?: string;
    unit?: string;
    name: string;
  }>;
  const steps = JSON.parse(recipe.steps) as string[];

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-3">
        <Link href="/" className="text-amber-700 hover:underline text-sm">
          ← Zurück
        </Link>
      </header>

      <main className="p-4">
        {recipe.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/uploads/${recipe.imagePath}`}
            alt={recipe.title}
            className="w-full max-h-64 object-cover rounded-xl mb-4"
          />
        ) : null}

        <h1 className="text-2xl font-bold text-stone-800 mb-4">{recipe.title}</h1>

        <section className="mb-6">
          <h2 className="font-semibold text-stone-700 mb-2">Zutaten</h2>
          <ul className="list-disc list-inside space-y-1 text-stone-600">
            {ingredients.map((i, idx) => (
              <li key={idx}>
                {i.amount && `${i.amount} `}
                {i.unit && `${i.unit} `}
                {i.name}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-stone-700 mb-2">Zubereitung</h2>
          <ol className="list-decimal list-inside space-y-2 text-stone-600">
            {steps.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

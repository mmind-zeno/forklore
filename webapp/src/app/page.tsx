import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-4">
        <h1 className="text-xl font-bold text-stone-800">Meine Rezepte</h1>
        <p className="text-sm text-stone-600">v0.1.0</p>
        <Link
          href="/add"
          className="mt-3 inline-block rounded-xl bg-amber-500 px-6 py-3 text-white font-semibold hover:bg-amber-600"
        >
          + Neues Rezept
        </Link>
      </header>

      <main className="p-4 pb-24">
        {recipes.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-100/50 p-12 text-center text-stone-600">
            <p className="mb-4">Noch keine Rezepte.</p>
            <Link
              href="/add"
              className="text-amber-600 hover:underline font-medium"
            >
              Erstes Rezept hinzufügen →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recipes.map((r) => (
              <Link
                key={r.id}
                href={`/recipe/${r.id}`}
                className="block rounded-xl overflow-hidden bg-white border border-stone-200 shadow-sm hover:shadow-md transition"
              >
                {r.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/uploads/${r.imagePath}`}
                    alt={r.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-stone-200 flex items-center justify-center text-stone-500">
                    Kein Bild
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-semibold text-stone-800">{r.title}</h2>
                  <p className="text-sm text-stone-500 mt-1">
                    {new Date(r.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

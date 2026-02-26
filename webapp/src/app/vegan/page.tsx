import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SUBSTITUTES = [
  {
    icon: "🥚",
    title: "Ei-Ersatz",
    items: [
      { name: "Leinsamen", ratio: "1 EL + 3 EL Wasser = 1 Ei", use: "Binden, Backen" },
      { name: "Chiasamen", ratio: "1 EL + 3 EL Wasser = 1 Ei", use: "Binden, Pudding" },
      { name: "Apfelmus", ratio: "60 g = 1 Ei", use: "Kuchen, Muffins" },
      { name: "Bananen", ratio: "½ zerdrückte Banane = 1 Ei", use: "Süßes Gebäck" },
      { name: "Seidentofu", ratio: "60 g püriert = 1 Ei", use: "Quiche, Cremes" },
      { name: "Aquafaba", ratio: "3 EL Kichererbsenwasser = 1 Ei", use: "Meringue, Baiser" },
      { name: "Stärke + Wasser", ratio: "1 EL Stärke + 2 EL Wasser = 1 Ei", use: "Binden" },
    ],
  },
  {
    icon: "🥛",
    title: "Milch-Ersatz",
    items: [
      { name: "Hafermilch", use: "Universal, gut zum Backen" },
      { name: "Mandelmilch", use: "Müsli, Desserts" },
      { name: "Sojamilch", use: "Kochen, Backen, Kaffee" },
      { name: "Reismilch", use: "Mild, für Süßes" },
      { name: "Kokosmilch", use: "Curry, Cremes, exotisch" },
    ],
  },
  {
    icon: "🧈",
    title: "Butter-Ersatz",
    items: [
      { name: "Margarine (vegan)", use: "1:1 beim Backen" },
      { name: "Kokosöl", use: "Kuchen, Kekse" },
      { name: "Apfelmus", use: "Reduziert Fett, süßer" },
      { name: "Olivenöl", use: "Herzhafte Gerichte" },
    ],
  },
  {
    icon: "🥛",
    title: "Sahne-Ersatz",
    items: [
      { name: "Cashew-Creme", use: "Pürieren, einweichen, mixen" },
      { name: "Kokosmilch (fett)", use: "Curry, Suppen, Desserts" },
      { name: "Seidentofu", use: "Pudding, Cremes" },
      { name: "Hafercreme", use: "Kochen, Soßen" },
    ],
  },
  {
    icon: "🧀",
    title: "Käse-Ersatz",
    items: [
      { name: "Hefeflocken", use: "Überbacken, Parmesan-Ersatz" },
      { name: "Cashew-Käse", use: "Streichkäse, Frischkäse" },
      { name: "Gereifter Tofu", use: "Würzig, Scheiben" },
      { name: "Veganer Reibekäse", use: "Pizza, Gratin" },
    ],
  },
];

export default async function VeganPage() {
  let veganRecipes: Awaited<ReturnType<typeof prisma.recipe.findMany>> = [];
  try {
    veganRecipes = await prisma.recipe.findMany({
      where: { tags: { contains: "vegan" } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch {
    // tags column may not exist on older DB
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/90 via-teal-50/40 to-emerald-50/50">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/15 via-teal-200/20 to-amber-200/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative px-4 py-8">
          <Link href="/" className="text-emerald-700 hover:text-emerald-600 font-medium text-sm inline-flex items-center gap-1">
            ← Zurück
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-stone-800">🌱 Vegan kochen</h1>
          <p className="mt-2 text-stone-600 max-w-xl">
            Ersatzstoffe und Tipps für pflanzenbasierte Küche. Ei, Milch, Butter – alles geht auch ohne.
          </p>
        </div>
      </header>

      <main className="p-4 pb-24 max-w-4xl mx-auto">
        <div className="space-y-8">
          {SUBSTITUTES.map((group) => (
            <section
              key={group.title}
              className="bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-200/80 shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{group.icon}</span> {group.title}
                </h2>
              </div>
              <div className="p-4">
                <ul className="space-y-3">
                  {group.items.map((item, ii) => (
                    <li key={ii} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 p-3 rounded-lg bg-stone-50/80">
                      <span className="font-semibold text-stone-800">{item.name}</span>
                      {"ratio" in item && (
                        <span className="text-sm text-emerald-700 font-medium">{item.ratio}</span>
                      )}
                      <span className="text-sm text-stone-600">{item.use}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        {veganRecipes.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Deine veganen Rezepte</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {veganRecipes.map((r) => (
                <Link
                  key={r.id}
                  href={`/recipe/${r.id}`}
                  className="flex gap-3 p-4 rounded-xl bg-white/90 border border-stone-200/80 shadow-sm hover:shadow-md hover:border-emerald-300/50 transition-all"
                >
                  {r.imagePath ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/uploads/${r.imagePath}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
                      🌱
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800 truncate">{r.title}</p>
                    <p className="text-xs text-emerald-600">vegan</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

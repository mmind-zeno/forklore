import Link from "next/link";
import { HeaderWithSuspense } from "@/components/HeaderWithSuspense";

export const dynamic = "force-dynamic";

const SUBSTITUTES = [
  {
    icon: "🥚",
    title: "Ei-Ersatz",
    intro: "Eier binden, lockern oder emulgieren – je nach Funktion gibt es den perfekten Ersatz.",
    items: [
      { name: "Leinsamen", ratio: "1 EL gemahlen + 3 EL Wasser", use: "Binden beim Backen – 15 Min. quellen lassen" },
      { name: "Chiasamen", ratio: "1 EL + 3 EL Wasser", use: "Binden, Pudding – werden gelartig" },
      { name: "Apfelmus", ratio: "60 g = 1 Ei", use: "Kuchen, Muffins – leicht süßlicher Geschmack" },
      { name: "Banane", ratio: "½ zerdrückte Banane = 1 Ei", use: "Süßes Gebäck, Pancakes" },
      { name: "Seidentofu", ratio: "60 g püriert = 1 Ei", use: "Quiche, Cremes, herzhafte Gerichte" },
      { name: "Aquafaba", ratio: "3 EL Kichererbsenwasser = 1 Ei", use: "Meringue, Baiser, Mousse – schaumig schlagen" },
      { name: "Stärke + Wasser", ratio: "1 EL Stärke + 2 EL Wasser", use: "Binden in Soßen, Suppen" },
      { name: "Backpulver + Essig", ratio: "1 TL Backpulver + 1 TL Weißweinessig", use: "Lockern – Gasentwicklung ersetzt das Ei" },
    ],
  },
  {
    icon: "🥛",
    title: "Milch-Ersatz",
    intro: "Pflanzliche Milchalternativen lassen sich 1:1 in fast allen Rezepten einsetzen.",
    items: [
      { name: "Hafermilch", use: "Universal – neutral im Geschmack, ideal zum Backen und Kochen" },
      { name: "Sojamilch", use: "Höchster Proteingehalt, gut für Kaffee und herzhafte Gerichte" },
      { name: "Mandelmilch", use: "Leicht nussig, für Müsli, Smoothies und Desserts" },
      { name: "Kokosmilch (dünn)", use: "Exotisch-süßlich, für asiatische Gerichte und Smoothies" },
      { name: "Reismilch", use: "Sehr mild und süß, gut für Desserts und empfindliche Mägen" },
      { name: "Cashewmilch", use: "Cremig, für Soßen und Suppen besonders geeignet" },
    ],
  },
  {
    icon: "🧈",
    title: "Butter-Ersatz",
    intro: "Beim Backen und Kochen gibt es immer eine pflanzliche Option.",
    items: [
      { name: "Vegane Margarine", use: "1:1 beim Backen und Kochen – direktester Ersatz" },
      { name: "Kokosöl (fest)", use: "Für Kekse und Kuchen – gibt Knusprigkeit" },
      { name: "Kokosöl (flüssig)", ratio: "¾ der Butter-Menge", use: "Für Pfannkuchen, Waffeln, Braten" },
      { name: "Apfelmus", use: "Ersetzt bis zu 50 % der Butter in Kuchen – macht saftiger" },
      { name: "Avocado (püriert)", use: "Für Mousse, Cremes, feuchte Kuchen – mild und cremig" },
      { name: "Olivenöl", ratio: "¾ der Butter-Menge", use: "Herzhafte Gerichte, mediterrane Rezepte" },
    ],
  },
  {
    icon: "🫙",
    title: "Sahne-Ersatz",
    intro: "Pflanzliche Sahne-Alternativen für Soßen, Suppen und Desserts.",
    items: [
      { name: "Kokosmilch (Vollfett)", use: "Über Nacht kalt stellen, oben abschöpfen – steifschlagbar!" },
      { name: "Cashew-Creme", ratio: "150 g eingeweichte Cashews + 120 ml Wasser", use: "Einweichen, pürieren – für Soßen und Cremes" },
      { name: "Hafercreme", use: "Für Kochen und Backen, weniger für Schlagen" },
      { name: "Seidentofu püriert", use: "Für Pudding, Cheesecake, Cremesuppen" },
      { name: "Mandel-Creme", use: "Leicht süßlich, für Desserts und Cremes" },
    ],
  },
  {
    icon: "🧀",
    title: "Käse-Ersatz",
    intro: "Von Parmesan bis Frischkäse – alles geht auch vegan.",
    items: [
      { name: "Hefeflocken", use: "2 EL = Parmesan-Ersatz – nussig-würziger Umami-Geschmack" },
      { name: "Cashew-Käse", use: "Einweichen, pürieren mit Zitrone, Knoblauch, Salz" },
      { name: "Tofu (geräuchert)", use: "Würzig, in Scheiben oder gerieben – für Pizza und Aufläufe" },
      { name: "Veganer Reibekäse", use: "Fertigprodukt – für Pizza, Gratin, überbackene Gerichte" },
      { name: "Mandel-Ricotta", use: "Mandeln blanchieren, pürieren – für Lasagne und Füllungen" },
    ],
  },
];

const PROTEINS = [
  { name: "Tofu (fest)", protein: "8 g / 100 g", use: "Anbraten, marinieren, crumble für Rührei-Ersatz" },
  { name: "Tofu (Seide)", protein: "5 g / 100 g", use: "Pudding, Cremes, Dressings, Scramble" },
  { name: "Tempeh", protein: "19 g / 100 g", use: "Fermentiert, nussig – marinieren und braten" },
  { name: "Seitan", protein: "25 g / 100 g", use: "Weizeneiweiß – fleischähnlich, für Schnitzel und Gulasch" },
  { name: "Linsen (gegart)", protein: "9 g / 100 g", use: "Suppen, Dal, Bolognese, Burger" },
  { name: "Kichererbsen", protein: "8 g / 100 g", use: "Curry, Salate, Hummus, als Snack rösten" },
  { name: "Schwarze Bohnen", protein: "9 g / 100 g", use: "Burger, Tacos, Chili" },
  { name: "Edamame", protein: "11 g / 100 g", use: "Als Snack, in Salaten und Reisgerichten" },
  { name: "Quinoa", protein: "14 g / 100 g (trocken)", use: "Vollständiges Protein – als Beilage, in Salaten" },
  { name: "Hanfsamen", protein: "31 g / 100 g", use: "Über Salate, ins Müsli – kein Einweichen nötig" },
];

const UMAMI_TIPS = [
  { name: "Hefeflocken", use: "Käsig-würziger Geschmack – auf Pasta, in Soßen, als Parmesan-Ersatz" },
  { name: "Miso-Paste (hell/dunkel)", use: "Umami-Boost in Suppen, Marinaden, Dressings – nicht kochen!" },
  { name: "Tamari / Shoyu", use: "Glutenfreie Sojasoße – intensiver als normales Soja" },
  { name: "Tomatenmark", use: "3 EL in der Pfanne anrösten für tiefe Würze in Soßen" },
  { name: "Getrocknete Pilze", use: "Einweichen + Einweichwasser verwenden – intensives Umami" },
  { name: "Liquid Smoke", use: "Wenige Tropfen für Räuchergeschmack bei Tofu und Fleischersatz" },
  { name: "Kapern + Kapernsud", use: "Salzig-würzig – für Soßen und mediterranes" },
  { name: "Nori-Blätter (zerkrümelt)", use: "Meeresgeschmack – in Suppen, auf Reisgerichten" },
];

const BAKING_TIPS = [
  { tip: "Sauerteig ist vegan", detail: "Klassischer Sauerteig enthält nur Mehl und Wasser – kein Tier nötig." },
  { tip: "Aquafaba für Baiser", detail: "3 EL Kichererbsenwasser mit Cremor Tartari steif schlagen – funktioniert perfekt!" },
  { tip: "Backpulver + Säure", detail: "Für extra Lockerheit: 1 TL Backpulver + 1 TL Apfelessig in den Teig." },
  { tip: "Pflanzenmilch im Kuchenteig", detail: "Hafermilch hat einen neutralen Geschmack und funktioniert in jedem Kuchenrezept 1:1." },
  { tip: "Zuckeralternativen", detail: "Agavensirup (flüssig), Kokosblütenzucker (1:1), Dattelsirup (malzig) oder Reissirup." },
  { tip: "Ganache ohne Sahne", detail: "200 g Zartbitter-Kuvertüre + 200 ml Kokosmilch erhitzen – ergibt perfekte vegane Ganache." },
  { tip: "Vegane Glasur", detail: "Puderzucker + Zitronensaft – keine Eier nötig. Für Colour: Rote-Bete-Saft, Matcha, Kurkuma." },
  { tip: "Feuchtigkeit bei Brownies", detail: "Schwarze Bohnen (püriert) ersetzen Mehl und Eier – ultra-saftige Brownies!" },
];

const KITCHEN_TIPS = [
  { tip: "Mise en place", detail: "Alle Zutaten vorbereiten und abmessen bevor du anfängst zu kochen – spart Zeit und verhindert Fehler." },
  { tip: "Zwiebeln ohne Tränen", detail: "Zwiebel 15 Min. ins Gefrierfach legen oder unter fließendem Wasser schneiden." },
  { tip: "Knoblauch schälen", detail: "Messerklinge flach auf die Knoblauchzehe legen, draufdrücken – die Schale löst sich sofort." },
  { tip: "Kräuter länger frisch", detail: "Wie Blumen ins Wasserglas stellen, mit Plastiktüte abdecken – hält 1–2 Wochen im Kühlschrank." },
  { tip: "Pasta-Wasser nutzen", detail: "Stärkehaltiges Kochwasser macht Soßen cremiger – immer eine Tasse aufheben." },
  { tip: "Pfanne richtig heiß werden lassen", detail: "Pfanne 2–3 Min. ohne Öl erhitzen, dann Öl dazu – verhindert Ankleben." },
  { tip: "Avocado reifen lassen", detail: "In eine Papiertüte mit Banane legen – Ethylengas beschleunigt den Reifeprozess." },
  { tip: "Ingwer einfrieren", detail: "Frischen Ingwer einfrieren – lässt sich dann direkt reiben ohne Schälen." },
  { tip: "Tofu Wasser entziehen", detail: "Tofu zwischen Küchentücher legen, Schneidebrett drauf, 30 Min. pressen – nimmt Marinade viel besser auf." },
  { tip: "Linsen schnell weich", detail: "Rote Linsen brauchen kein Einweichen und kochen in 10–15 Min. – perfekt für schnelle Gerichte." },
];

const STORAGE_TIPS = [
  { ingredient: "Avocado (angeschnitten)", tip: "Kern drin lassen, mit Zitronensaft beträufeln, Frischhaltefolie direkt auf das Fruchtfleisch" },
  { ingredient: "Frische Kräuter", tip: "Stiele in Wasser stellen (wie Blumen), mit Plastiktüte bedecken – 1–2 Wochen haltbar" },
  { ingredient: "Tofu (geöffnet)", tip: "In frisches Wasser legen, täglich wechseln – bis zu 7 Tage haltbar" },
  { ingredient: "Tomaten", tip: "NIE im Kühlschrank – verlieren Aroma. Bei Zimmertemperatur auf der Unterseite lagern" },
  { ingredient: "Bananen", tip: "Von der Traube trennen, Stiele mit Folie wickeln – verlangsamt das Braunwerden" },
  { ingredient: "Pilze", tip: "In Papiertüte im Kühlschrank – nicht in Plastik, sonst werden sie matschig" },
  { ingredient: "Schalotten / Knoblauch", tip: "Kühl, dunkel, trocken und mit Luftzufuhr lagern – nicht im Kühlschrank" },
  { ingredient: "Getrocknete Hülsenfrüchte", tip: "Luftdicht in dunklen Behältern – jahrelang haltbar, nie zusammen mit Zwiebeln" },
  { ingredient: "Offene Konserven", tip: "Niemals in der Dose im Kühlschrank – sofort in Glas oder Dose umfüllen" },
  { ingredient: "Nüsse und Samen", tip: "Im Tiefkühler – Fette werden nicht ranzig, Geschmack bleibt frisch für Monate" },
];

export default function TipsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <HeaderWithSuspense />

      <main className="pt-24 px-6 py-8 pb-24 max-w-4xl mx-auto">
        <header className="mb-10 reveal">
          <Link href="/" className="text-terra hover:text-terra-dark font-bold text-sm inline-flex items-center gap-1 transition-colors">
            ← Zurück
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold text-espresso">💡 Tips & Tricks</h1>
          <p className="mt-3 text-espresso-mid max-w-2xl text-lg">
            Vegane Ersatzstoffe, Küchengeheimnisse und praktische Alltagstipps für mehr Freude beim Kochen und Backen.
          </p>

          {/* Quick navigation */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { href: "#ersatzstoffe", label: "🌱 Vegane Ersatzstoffe" },
              { href: "#proteine", label: "🫘 Proteine" },
              { href: "#umami", label: "🧂 Umami" },
              { href: "#backen", label: "🥣 Veganes Backen" },
              { href: "#kueche", label: "🔪 Küchentipps" },
              { href: "#aufbewahrung", label: "❄️ Aufbewahrung" },
            ].map((nav) => (
              <a
                key={nav.href}
                href={nav.href}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-warmwhite border border-espresso/10 text-espresso-mid hover:border-terra/30 hover:text-terra transition-colors"
              >
                {nav.label}
              </a>
            ))}
          </div>
        </header>

        {/* ─── Vegane Ersatzstoffe ─── */}
        <section id="ersatzstoffe" className="mb-14">
          <h2 className="font-display text-2xl font-bold text-espresso mb-1 flex items-center gap-2 reveal">
            🌱 Vegane Ersatzstoffe
          </h2>
          <p className="text-espresso-mid text-sm mb-6 reveal">Ei, Milch, Butter, Sahne, Käse – für jede tierische Zutat gibt es eine pflanzliche Alternative.</p>
          <div className="space-y-6">
            {SUBSTITUTES.map((group) => (
              <section
                key={group.title}
                className="bg-warmwhite rounded-2xl border border-espresso/6 shadow-sm overflow-hidden reveal"
              >
                <div className="bg-gradient-sage px-6 py-3 flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <span>{group.icon}</span> {group.title}
                  </h3>
                </div>
                {group.intro && (
                  <p className="px-6 pt-4 pb-2 text-sm text-espresso-mid">{group.intro}</p>
                )}
                <div className="p-4 pt-2">
                  <ul className="space-y-2">
                    {group.items.map((item, ii) => (
                      <li key={ii} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-3 rounded-xl bg-cream/60 border border-espresso/5">
                        <span className="font-bold text-espresso text-sm min-w-[140px]">{item.name}</span>
                        {"ratio" in item && item.ratio && (
                          <span className="text-xs text-sage font-bold bg-sage/10 px-2 py-0.5 rounded-full whitespace-nowrap self-start">{item.ratio}</span>
                        )}
                        <span className="text-sm text-espresso-mid">{item.use}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        </section>

        {/* ─── Pflanzliche Proteine ─── */}
        <section id="proteine" className="mb-14">
          <h2 className="font-display text-2xl font-bold text-espresso mb-1 flex items-center gap-2 reveal">
            🫘 Pflanzliche Proteinquellen
          </h2>
          <p className="text-espresso-mid text-sm mb-6 reveal">Vegane Küche kann mehr als genug Protein liefern – wenn man die richtigen Zutaten kennt.</p>
          <div className="bg-warmwhite rounded-2xl border border-espresso/6 shadow-sm overflow-hidden reveal">
            <div className="bg-terra/10 px-6 py-3">
              <div className="grid grid-cols-3 text-[11px] font-bold uppercase tracking-widest text-espresso-mid">
                <span>Zutat</span>
                <span>Protein</span>
                <span className="col-span-1">Verwendung</span>
              </div>
            </div>
            <div className="divide-y divide-espresso/5">
              {PROTEINS.map((p, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 px-6 py-3 hover:bg-cream/50 transition-colors text-sm">
                  <span className="font-bold text-espresso">{p.name}</span>
                  <span className="text-terra font-bold text-xs self-center">{p.protein}</span>
                  <span className="text-espresso-mid text-xs leading-relaxed">{p.use}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Umami & Würzen ─── */}
        <section id="umami" className="mb-14">
          <h2 className="font-display text-2xl font-bold text-espresso mb-1 flex items-center gap-2 reveal">
            🧂 Umami & Würzen
          </h2>
          <p className="text-espresso-mid text-sm mb-6 reveal">Tiefe Würze ohne Fleisch – diese Zutaten bringen Umami in jedes vegane Gericht.</p>
          <div className="space-y-2 reveal">
            {UMAMI_TIPS.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 p-4 rounded-xl bg-warmwhite border border-espresso/6 shadow-sm hover:border-terra/20 transition-colors">
                <span className="font-bold text-espresso text-sm min-w-[180px]">{item.name}</span>
                <span className="text-sm text-espresso-mid">{item.use}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Veganes Backen ─── */}
        <section id="backen" className="mb-14">
          <h2 className="font-display text-2xl font-bold text-espresso mb-1 flex items-center gap-2 reveal">
            🥣 Veganes Backen
          </h2>
          <p className="text-espresso-mid text-sm mb-6 reveal">Backen ohne Eier und Milchprodukte – so klappt es zuverlässig.</p>
          <div className="grid sm:grid-cols-2 gap-4 reveal">
            {BAKING_TIPS.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-warmwhite border border-espresso/6 shadow-sm">
                <p className="font-bold text-espresso text-sm mb-1 flex items-start gap-2">
                  <span className="text-terra mt-0.5">✦</span>
                  {item.tip}
                </p>
                <p className="text-sm text-espresso-mid pl-5">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Allgemeine Küchentipps ─── */}
        <section id="kueche" className="mb-14">
          <h2 className="font-display text-2xl font-bold text-espresso mb-1 flex items-center gap-2 reveal">
            🔪 Küchentipps
          </h2>
          <p className="text-espresso-mid text-sm mb-6 reveal">Kleine Tricks mit großer Wirkung – für effizienteres und entspannteres Kochen.</p>
          <div className="grid sm:grid-cols-2 gap-4 reveal">
            {KITCHEN_TIPS.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-warmwhite border border-espresso/6 shadow-sm hover:shadow-card transition-shadow">
                <p className="font-bold text-espresso text-sm mb-1 flex items-start gap-2">
                  <span className="text-terra mt-0.5">✦</span>
                  {item.tip}
                </p>
                <p className="text-sm text-espresso-mid pl-5">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Aufbewahrung ─── */}
        <section id="aufbewahrung" className="mb-14">
          <h2 className="font-display text-2xl font-bold text-espresso mb-1 flex items-center gap-2 reveal">
            ❄️ Richtig Aufbewahren
          </h2>
          <p className="text-espresso-mid text-sm mb-6 reveal">Lebensmittel länger frisch halten – weniger Abfall, mehr Geschmack.</p>
          <div className="bg-warmwhite rounded-2xl border border-espresso/6 shadow-sm overflow-hidden reveal">
            <div className="divide-y divide-espresso/5">
              {STORAGE_TIPS.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-6 px-6 py-3 hover:bg-cream/50 transition-colors">
                  <span className="font-bold text-espresso text-sm min-w-[180px]">{item.ingredient}</span>
                  <span className="text-sm text-espresso-mid">{item.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <div className="p-6 rounded-2xl bg-sage/10 border border-sage/20 reveal">
          <h2 className="font-display text-lg font-bold text-sage-dark mb-2">🌱 Vegane Rezepte entdecken</h2>
          <p className="text-espresso-mid text-sm mb-4">
            Auf der Startseite kannst du unter Backen und Kochen mit dem Schalter &bdquo;Nur vegan&ldquo; nach veganen Rezepten filtern.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/?vegan=true"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage text-white font-bold text-sm hover:bg-sage-dark transition-colors"
            >
              🌱 Vegane Rezepte →
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-terra font-bold text-sm hover:underline px-4 py-2"
            >
              Alle Rezepte →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

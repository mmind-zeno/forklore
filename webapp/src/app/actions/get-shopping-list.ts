"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ingredient = { amount?: string; unit?: string; name: string };

/** Extrahiert Zahl aus Mengenangabe (z. B. "ca. 100" → 100) für Summierung. */
function parseAmount(s: string): number | null {
  const t = s.replace(/^(ca\.?|circa|etwa)\s*/i, "").trim().replace(",", ".");
  const n = parseFloat(t);
  return Number.isNaN(n) ? null : n;
}

/** Rezepttitel für Deduplizierung normalisieren (z. B. "Buchweizen-Cookies" und "Buchweizen Cookies" → ein Eintrag). */
function normalizeRecipeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalisiert Zutatenname für Zusammenfassung (Singular, Synonyme). Gibt vollen Namen zurück, wenn nicht im Map. */
function normalizeName(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return "";
  const map: Record<string, string> = {
    zwiebeln: "zwiebel",
    knoblauchzehe: "knoblauch",
    knoblauchzehen: "knoblauch",
    tomaten: "tomate",
    kartoffeln: "kartoffel",
    eier: "ei",
    möhren: "karotte",
    karotten: "karotte",
    paprika: "paprika",
    paprikaschote: "paprika",
    paprikaschoten: "paprika",
    champignons: "champignon",
    zitronen: "zitrone",
    orangen: "orange",
    äpfel: "apfel",
    bananen: "banane",
    zwiebel: "zwiebel",
    knoblauch: "knoblauch",
    mehl: "mehl",
    zucker: "zucker",
    salz: "salz",
    pfeffer: "pfeffer",
    öl: "öl",
    butter: "butter",
    milch: "milch",
    sahne: "sahne",
    "creme fraiche": "sahne",
    creme: "sahne",
    schmand: "sahne",
    käse: "käse",
    tapiokastärke: "tapioka",
  };
  const key = s.replace(/\s*,\s*.*$/, "").trim(); // "Zwiebel, fein gewürfelt" → "zwiebel"
  const base = key.split(/\s+/)[0] ?? key;
  return map[base] ?? map[key] ?? key; // vollen key zurück, keine Ein-Wort-Fragmente
}

/** Kategorie für Sortierung (Reihenfolge = Anzeige). */
const CATEGORY_ORDER = [
  "Gemüse & Salat",
  "Obst",
  "Milchprodukte & Eier",
  "Fleisch & Fisch",
  "Getreide & Backen",
  "Gewürze & Öle",
  "Sonstiges",
] as const;

/** "ei" nur als ganzes Wort (nicht in "mehl", "leinsamen"). */
function matchesWord(n: string, term: string): boolean {
  if (term === "ei") {
    return n === "ei" || /(^|\s)ei(\s|$)/.test(` ${n} `);
  }
  return n.includes(term) || term.includes(n);
}

function getCategory(normalizedName: string): (typeof CATEGORY_ORDER)[number] {
  const n = normalizedName;
  const veg = [
    "zwiebel",
    "tomate",
    "kartoffel",
    "karotte",
    "paprika",
    "champignon",
    "brokkoli",
    "blumenkohl",
    "spinat",
    "lauch",
    "sellerie",
    "gurke",
    "salat",
    "basilikum",
    "petersilie",
    "dill",
    "schnittlauch",
    "knoblauch",
    "rote bete",
    "bete",
    "edamame",
    "sprossen",
  ];
  if (veg.some((v) => matchesWord(n, v))) return "Gemüse & Salat";
  const obst = ["zitrone", "orange", "apfel", "banane", "beere", "erdbeere", "himbeere", "mango", "birne", "ananas", "apfelmus", "heidelbeere"];
  if (obst.some((v) => matchesWord(n, v))) return "Obst";
  const milch = ["milch", "sahne", "käse", "butter", "ei", "joghurt", "quark", "frischkäse"];
  if (milch.some((v) => matchesWord(n, v))) return "Milchprodukte & Eier";
  const fleisch = ["huhn", "fleisch", "rind", "schwein", "lachs", "fisch", "wurst", "speck", "thunfisch"];
  if (fleisch.some((v) => matchesWord(n, v))) return "Fleisch & Fisch";
  const getreide = ["mehl", "zucker", "backpulver", "hefe", "hafer", "reis", "nudeln", "brot", "semmel", "leinsamen", "buchweizen", "reismehl", "kokosraspel"];
  if (getreide.some((v) => matchesWord(n, v))) return "Getreide & Backen";
  const gewuerze = ["salz", "pfeffer", "öl", "essig", "gewürz", "paprika", "curry", "oregano", "thymian", "zimt", "vanille", "sesam", "ahornsirup", "dressing"];
  if (gewuerze.some((v) => matchesWord(n, v))) return "Gewürze & Öle";
  return "Sonstiges";
}

/** weekStart = "YYYY-MM-DD" (Monday). Aggregiert Zutaten, normalisiert Namen, kategorisiert. */
export async function getShoppingList(weekStart: string): Promise<{
  success: boolean;
  items?: { name: string; amount: string; unit: string; recipes: string[]; category: string }[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Nicht angemeldet." };
    }
    const start = new Date(weekStart);
    if (Number.isNaN(start.getTime())) {
      return { success: false, error: "Ungültiges Datum." };
    }

    const entries = await prisma.mealPlanEntry.findMany({
      where: { userId: session.user.id, weekStart: start },
      include: { recipe: { select: { id: true, title: true, ingredients: true } } },
      orderBy: { dayOfWeek: "asc" },
    });

    const byKey = new Map<
      string,
      { amount: string; unit: string; recipes: Map<string, string>; numericAmount?: number; displayName: string }
    >();

    for (const e of entries) {
      let list: Ingredient[] = [];
      try {
        const parsed = JSON.parse(e.recipe.ingredients);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        // ignore
      }
      const recipeTitle = e.recipe.title;
      const recipeNorm = normalizeRecipeTitle(recipeTitle);
      for (const ing of list) {
        const rawName = (ing.name ?? "").trim();
        if (!rawName) continue;
        const normalized = normalizeName(rawName);
        const unit = (ing.unit ?? "").trim() || "—";
        const amountStr = (ing.amount ?? "").trim() || "—";
        const key = `${normalized}::${unit}`;
        const numRaw = parseAmount(amountStr) ?? parseFloat(amountStr.replace(",", "."));
        const isNumeric = typeof numRaw === "number" && !Number.isNaN(numRaw);
        const num = isNumeric ? numRaw : 0;
        const displayName =
          normalized.charAt(0).toUpperCase() + normalized.slice(1);

        if (!byKey.has(key)) {
          const recipesMap = new Map<string, string>();
          recipesMap.set(recipeNorm, recipeTitle);
          byKey.set(key, {
            amount: amountStr,
            unit,
            recipes: recipesMap,
            numericAmount: isNumeric ? num : undefined,
            displayName,
          });
        } else {
          const cur = byKey.get(key)!;
          if (!cur.recipes.has(recipeNorm)) cur.recipes.set(recipeNorm, recipeTitle);
          if (isNumeric && cur.numericAmount !== undefined) {
            cur.numericAmount += num;
            cur.amount =
              cur.numericAmount % 1 === 0
                ? String(Math.round(cur.numericAmount))
                : cur.numericAmount.toFixed(1).replace(".", ",");
          } else if (isNumeric && cur.amount !== "—") {
            const curNum = parseAmount(cur.amount) ?? parseFloat(cur.amount.replace(",", "."));
            if (!Number.isNaN(curNum)) {
              cur.numericAmount = curNum + num;
              cur.amount =
                cur.numericAmount! % 1 === 0
                  ? String(Math.round(cur.numericAmount!))
                  : cur.numericAmount!.toFixed(1).replace(".", ",");
            }
          } else if (amountStr !== "—" && cur.amount !== "—" && cur.amount !== amountStr) {
            cur.amount = `${cur.amount} + ${amountStr}`;
          }
        }
      }
    }

    const items = Array.from(byKey.entries()).map(([, v]) => ({
      name: v.displayName,
      amount: v.amount,
      unit: v.unit,
      recipes: Array.from(v.recipes.values()).sort(),
      category: getCategory(v.displayName.toLowerCase()),
    }));

    const catOrder = (c: string) => CATEGORY_ORDER.indexOf(c as (typeof CATEGORY_ORDER)[number]);
    items.sort((a, b) => {
      const ca = catOrder(a.category);
      const cb = catOrder(b.category);
      if (ca !== cb) return ca - cb;
      return a.name.localeCompare(b.name);
    });

    return { success: true, items };
  } catch (err) {
    console.error("getShoppingList error:", err);
    return { success: false, error: "Einkaufsliste konnte nicht erstellt werden." };
  }
}

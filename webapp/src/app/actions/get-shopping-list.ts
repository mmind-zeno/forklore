"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ingredient = { amount?: string; unit?: string; name: string };

/** Normalisiert Zutatenname für Zusammenfassung (Singular, Synonyme). */
function normalizeName(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return "";
  // Synonyme / Plural → einheitlicher Name (klein)
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
  };
  const key = s.replace(/\s*,\s*.*$/, ""); // "Zwiebel, fein gewürfelt" → "zwiebel"
  const base = key.split(/\s+/)[0] ?? key;
  return map[base] ?? map[key] ?? base;
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
  ];
  if (veg.some((v) => n.includes(v) || v.includes(n))) return "Gemüse & Salat";
  const obst = ["zitrone", "orange", "apfel", "banane", "beere", "erdbeere", "himbeere", "mango", "birne"];
  if (obst.some((v) => n.includes(v) || v.includes(n))) return "Obst";
  const milch = ["milch", "sahne", "käse", "butter", "ei", "joghurt", "quark", "frischkäse"];
  if (milch.some((v) => n.includes(v) || v.includes(n))) return "Milchprodukte & Eier";
  const fleisch = ["huhn", "fleisch", "rind", "schwein", "lachs", "fisch", "wurst", "speck"];
  if (fleisch.some((v) => n.includes(v) || v.includes(n))) return "Fleisch & Fisch";
  const getreide = ["mehl", "zucker", "backpulver", "hefe", "hafer", "reis", "nudeln", "brot", "semmel"];
  if (getreide.some((v) => n.includes(v) || v.includes(n))) return "Getreide & Backen";
  const gewuerze = ["salz", "pfeffer", "öl", "essig", "gewürz", "paprika", "curry", "oregano", "thymian", "zimt", "vanille"];
  if (gewuerze.some((v) => n.includes(v) || v.includes(n))) return "Gewürze & Öle";
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
      { amount: string; unit: string; recipes: Set<string>; numericAmount?: number; displayName: string }
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
      for (const ing of list) {
        const rawName = (ing.name ?? "").trim();
        if (!rawName) continue;
        const normalized = normalizeName(rawName);
        const unit = (ing.unit ?? "").trim() || "—";
        const amountStr = (ing.amount ?? "").trim() || "—";
        const key = `${normalized}::${unit}`;
        const num = parseFloat(amountStr.replace(",", "."));
        const isNumeric = !Number.isNaN(num);
        const displayName =
          normalized.charAt(0).toUpperCase() + normalized.slice(1);

        if (!byKey.has(key)) {
          byKey.set(key, {
            amount: amountStr,
            unit,
            recipes: new Set([recipeTitle]),
            numericAmount: isNumeric ? num : undefined,
            displayName,
          });
        } else {
          const cur = byKey.get(key)!;
          cur.recipes.add(recipeTitle);
          if (isNumeric && cur.numericAmount !== undefined) {
            cur.numericAmount += num;
            cur.amount =
              cur.numericAmount % 1 === 0
                ? String(Math.round(cur.numericAmount))
                : cur.numericAmount.toFixed(1).replace(".", ",");
          } else if (isNumeric && cur.amount !== "—") {
            const curNum = parseFloat(cur.amount.replace(",", "."));
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
      recipes: Array.from(v.recipes).sort(),
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

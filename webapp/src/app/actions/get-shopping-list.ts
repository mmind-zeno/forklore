"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ingredient = { amount?: string; unit?: string; name: string };

/** weekStart = "YYYY-MM-DD" (Monday). Aggregiert Zutaten aller Rezepte der Woche. */
export async function getShoppingList(weekStart: string): Promise<{
  success: boolean;
  items?: { name: string; amount: string; unit: string; recipes: string[] }[];
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
      { amount: string; unit: string; recipes: Set<string>; numericAmount?: number }
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
        const name = (ing.name ?? "").trim().toLowerCase();
        if (!name) continue;
        const unit = (ing.unit ?? "").trim() || "—";
        const amountStr = (ing.amount ?? "").trim() || "—";
        const key = `${name}::${unit}`;
        const num = parseFloat(amountStr.replace(",", "."));
        const isNumeric = !Number.isNaN(num);

        if (!byKey.has(key)) {
          byKey.set(key, {
            amount: amountStr,
            unit,
            recipes: new Set([recipeTitle]),
            numericAmount: isNumeric ? num : undefined,
          });
        } else {
          const cur = byKey.get(key)!;
          cur.recipes.add(recipeTitle);
          if (isNumeric && cur.numericAmount !== undefined) {
            cur.numericAmount += num;
            cur.amount = cur.numericAmount % 1 === 0 ? String(Math.round(cur.numericAmount)) : cur.numericAmount.toFixed(1).replace(".", ",");
          } else if (isNumeric && cur.amount !== "—") {
            const curNum = parseFloat(cur.amount.replace(",", "."));
            if (!Number.isNaN(curNum)) {
              cur.numericAmount = curNum + num;
              cur.amount = cur.numericAmount % 1 === 0 ? String(Math.round(cur.numericAmount)) : cur.numericAmount.toFixed(1).replace(".", ",");
            }
          } else if (amountStr !== "—" && cur.amount !== "—" && cur.amount !== amountStr) {
            cur.amount = `${cur.amount} + ${amountStr}`;
          }
        }
      }
    }

    const items = Array.from(byKey.entries())
      .map(([key, v]) => {
        const [name] = key.split("::");
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          amount: v.amount,
          unit: v.unit,
          recipes: Array.from(v.recipes).sort(),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, items };
  } catch (err) {
    console.error("getShoppingList error:", err);
    return { success: false, error: "Einkaufsliste konnte nicht erstellt werden." };
  }
}

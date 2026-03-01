"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShoppingList } from "./get-shopping-list";
import { getOpenAIClient, getOpenAIApiKey } from "@/lib/openai";

const CATEGORIES = [
  "Gemüse & Salat",
  "Obst",
  "Milchprodukte & Eier",
  "Fleisch & Fisch",
  "Getreide & Backen",
  "Gewürze & Öle",
  "Sonstiges",
] as const;

const SHOPPING_LIST_SCHEMA = {
  type: "object" as const,
  properties: {
    items: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          amount: { type: "string" as const },
          unit: { type: "string" as const },
          recipes: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          category: {
            type: "string" as const,
            enum: [...CATEGORIES],
          },
        },
        required: ["name", "amount", "unit", "recipes", "category"] as const,
        additionalProperties: false,
      },
    },
  },
  required: ["items"] as const,
  additionalProperties: false,
};

export type ShoppingItemAI = {
  name: string;
  amount: string;
  unit: string;
  recipes: string[];
  category: string;
};

/** Einkaufsliste mit KI zusammenfassen und bereinigen. */
export async function getShoppingListWithAI(weekStart: string): Promise<{
  success: boolean;
  items?: ShoppingItemAI[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Nicht angemeldet." };
    }

    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return { success: false, error: "OpenAI API Key nicht konfiguriert. Bitte in Admin → Settings hinterlegen." };
    }

    const listRes = await getShoppingList(weekStart);
    if (!listRes.success || !listRes.items || listRes.items.length === 0) {
      return { success: true, items: listRes.items ?? [] };
    }

    const rawList = listRes.items.map((i) => ({
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      recipes: i.recipes,
    }));

    const openai = await getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Du bist ein Assistent für Einkaufslisten. Du erhältst eine rohe Einkaufsliste aus mehreren Rezepten.
Deine Aufgabe:
1. Gleiche oder sehr ähnliche Zutaten zusammenführen (z. B. "Edamame" und "Edamame 50g" → eine Zeile "Edamame 50g"; "Buchweizenmehl" und "Buchweizenmehl" mit verschiedenen Mengen → eine Zeile mit summierter Menge).
2. Mengen addieren, wenn gleiche Einheit (g, ml, TL, EL, Prise, Stück).
3. Einheiten vereinheitlichen: g, kg, ml, l, TL, EL, Prise, Pkg, Stück.
4. Jeder Eintrag braucht: name (kurz, singular), amount (Zahl oder "nach Bedarf"), unit, recipes (Array der Rezeptnamen), category.
5. category muss genau eine sein von: ${CATEGORIES.join(", ")}.
6. Sortiere die items zuerst nach category (Reihenfolge wie oben), dann nach name alphabetisch.
Antworte NUR mit dem JSON-Objekt (kein anderer Text).`,
        },
        {
          role: "user",
          content: `Rohe Einkaufsliste (JSON):\n${JSON.stringify(rawList, null, 0)}`,
        },
      ],
      max_tokens: 4096,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "shopping_list",
          strict: true,
          schema: SHOPPING_LIST_SCHEMA,
        },
      },
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return { success: false, error: "KI konnte Liste nicht erstellen. Bitte Standardliste nutzen." };
    }

    let parsed: { items: ShoppingItemAI[] };
    try {
      parsed = JSON.parse(content) as { items: ShoppingItemAI[] };
    } catch {
      return { success: false, error: "Ungültige KI-Antwort. Bitte Standardliste nutzen." };
    }

    if (!Array.isArray(parsed.items)) {
      return { success: false, error: "Ungültiges Format. Bitte Standardliste nutzen." };
    }

    const valid = parsed.items.filter(
      (i) => i && typeof i.name === "string" && Array.isArray(i.recipes)
    ) as ShoppingItemAI[];
    return { success: true, items: valid };
  } catch (err) {
    console.error("getShoppingListWithAI error:", err);
    return { success: false, error: "KI-Optimierung fehlgeschlagen. Bitte Standardliste nutzen." };
  }
}

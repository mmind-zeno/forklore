"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShoppingList } from "./get-shopping-list";
import { getLlmProvider, getGeminiApiKey, chatCompletion } from "@/lib/llm";
import { getOpenAIApiKey } from "@/lib/openai";

const CATEGORIES = [
  "Gemüse & Salat",
  "Obst",
  "Milchprodukte & Eier",
  "Fleisch & Fisch",
  "Getreide & Backen",
  "Gewürze & Öle",
  "Sonstiges",
] as const;

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
    const aiUntil = session.user.aiAccessUntil;
    if (aiUntil == null || new Date(aiUntil) <= new Date()) {
      return { success: false, error: "KI-Zugang nicht aktiv. Bitte Admin kontaktieren." };
    }

    const provider = await getLlmProvider();
    const openaiApiKey = await getOpenAIApiKey();
    const geminiApiKey = provider === "gemini" ? await getGeminiApiKey() : null;
    if (provider === "openai" && !openaiApiKey) {
      return { success: false, error: "OpenAI API Key nicht konfiguriert. Bitte in Admin → Settings hinterlegen." };
    }
    if (provider === "gemini" && !geminiApiKey) {
      return { success: false, error: "Gemini API Key nicht konfiguriert. Bitte in Admin → Settings hinterlegen." };
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

    const systemPrompt = `Du bist ein Assistent für Einkaufslisten. Du erhältst eine rohe Einkaufsliste aus mehreren Rezepten.
Deine Aufgabe:
1. Gleiche oder sehr ähnliche Zutaten zusammenführen (z. B. "Edamame" und "Edamame 50g" → eine Zeile "Edamame 50g"; "Buchweizenmehl" und "Buchweizenmehl" mit verschiedenen Mengen → eine Zeile mit summierter Menge).
2. Mengen addieren, wenn gleiche Einheit (g, ml, TL, EL, Prise, Stück).
3. Einheiten vereinheitlichen: g, kg, ml, l, TL, EL, Prise, Pkg, Stück.
4. Jeder Eintrag braucht: name (kurz, singular), amount (Zahl oder "nach Bedarf"), unit, recipes (Array der Rezeptnamen), category.
5. category muss genau eine sein von: ${CATEGORIES.join(", ")}.
6. Sortiere die items zuerst nach category (Reihenfolge wie oben), dann nach name alphabetisch.
Antworte NUR mit einem JSON-Objekt im Format {"items": [{"name":"...","amount":"...","unit":"...","recipes":["..."],"category":"..."}]} (kein anderer Text).`;

    let content: string;
    try {
      content = await chatCompletion({
        systemPrompt,
        userMessage: `Rohe Einkaufsliste (JSON):\n${JSON.stringify(rawList, null, 0)}`,
      });
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "KI konnte Liste nicht erstellen. Bitte Standardliste nutzen.",
      };
    }
    content = content?.trim() ?? "";
    if (!content) {
      return { success: false, error: "KI konnte Liste nicht erstellen. Bitte Standardliste nutzen." };
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    let parsed: { items: ShoppingItemAI[] };
    try {
      parsed = JSON.parse(jsonStr) as { items: ShoppingItemAI[] };
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

"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getOpenAIClient, getOpenAIApiKey } from "@/lib/openai";
import { getLlmProvider, getGeminiApiKey, chatCompletion } from "@/lib/llm";
import { resizeImageForRecipe } from "@/lib/image-resize";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export type RecipeInput = {
  title: string;
  ingredients: Array<{ amount?: string; unit?: string; name: string }>;
  steps: string[];
  category?: "backen" | "kochen";
  tags?: string[];
};

function extractRecipeJson(content: string): string | null {
  if (!content?.trim()) return null;
  const trimmed = content.trim();
  // 1. Markdown-Codeblock: ```json ... ``` oder ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const inner = codeBlockMatch[1].trim();
    if (inner.startsWith("{")) return inner;
  }
  // 2. Reines JSON-Objekt
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

export async function createRecipe(
  formData: FormData
): Promise<{ success: boolean; recipeCount?: number; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const until = session.user.aiAccessUntil;
      if (until == null || new Date(until) <= new Date()) {
        return { success: false, error: "KI-Zugang nicht aktiv. Bitte Admin kontaktieren." };
      }
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

    const mode = (formData.get("mode") as string) || "mic";
    if (mode === "mic" && !openaiApiKey) {
      return { success: false, error: "OpenAI API Key für Whisper (Sprache) erforderlich. Bitte in Admin → Settings hinterlegen." };
    }

    const openai = await getOpenAIClient();
    const imageFile = formData.get("image") as File | null;
    const audioFile = formData.get("audio") as File | null;
    const noteText = (formData.get("text") as string) || "";

    let recipe: RecipeInput;
    let imageFilename: string | null = null;

    if (mode === "note") {
      // Notiz-Modus: Text (evtl. + Bild)
      if (!noteText.trim()) {
        return { success: false, error: "Bitte Rezept-Notiz eingeben." };
      }

      const systemPrompt = `Du bist ein Koch-Assistent. Extrahiere aus dem folgenden Rezept-Text ein strukturiertes Rezept.
Antworte NUR mit einem JSON-Objekt in diesem Format:
{"title":"Rezeptname","ingredients":[{"amount":"Menge","unit":"Einheit","name":"Zutat"}],"steps":["Schritt 1","Schritt 2"],"category":"backen oder kochen","tags":["vegan","schnell"]}
- category: "backen" für Kuchen, Kekse, Brot, Teig; "kochen" für Suppen, Hauptgerichte, Salate.
- tags: optional Array, z.B. ["vegan"], ["vegetarisch"], ["schnell"] wenn zutreffend.
- Für amount und unit: leere Zeichenkette "" verwenden, wenn keine Angabe möglich ist.
- Für category: "" verwenden wenn unklar; sonst "backen" oder "kochen".
- Für tags: leeres Array [] wenn keine Tags zutreffen.
Schätze fehlende Mengen mit "ca." wenn nötig. Alle Texte auf Deutsch. Antworte ausschließlich mit dem JSON-Objekt, kein anderer Text.`;

      let resizedImage: { buffer: Buffer; mimeType: string; ext: string } | null = null;
      if (imageFile?.size) {
        const rawBuffer = Buffer.from(await imageFile.arrayBuffer());
        const mime = imageFile.type || "image/jpeg";
        resizedImage = await resizeImageForRecipe(rawBuffer, mime);
      }

      let content: string;
      try {
        content = await chatCompletion({
          systemPrompt,
          userMessage: `Rezept-Notiz:\n${noteText.trim()}`,
          ...(resizedImage
            ? { imageBase64: resizedImage.buffer.toString("base64"), imageMimeType: resizedImage.mimeType }
            : {}),
        });
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Keine Antwort von der KI",
        };
      }
      if (!content?.trim()) {
        return { success: false, error: "Keine Antwort von der KI" };
      }

      let jsonStr = extractRecipeJson(content);
      if (!jsonStr) {
        jsonStr = content.match(/\{[\s\S]*\}/)?.[0] ?? null;
      }
      if (!jsonStr) {
        console.error("createRecipe: GPT content without JSON:", content?.slice(0, 500));
        return {
          success: false,
          error: content.startsWith("I'm sorry")
            ? "Die KI konnte das Rezept nicht extrahieren. Bitte Bild und Text prüfen."
            : "Ungültige Antwort der KI. Bitte erneut versuchen.",
        };
      }
      recipe = JSON.parse(jsonStr);

      if (resizedImage) {
        const uploadsDir = path.join(process.cwd(), "uploads");
        await mkdir(uploadsDir, { recursive: true });
        imageFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${resizedImage.ext}`;
        await writeFile(path.join(uploadsDir, imageFilename), resizedImage.buffer);
      }
    } else {
      // Mikrofon-Modus: Audio + Bild
      if (!imageFile?.size || !audioFile?.size) {
        return { success: false, error: "Bitte Foto und Sprachaufnahme hinzufügen." };
      }

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "de",
      });
      const transcript = transcription.text;

      const rawImageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const mime = imageFile.type || "image/jpeg";
      const { buffer: imageBuffer, mimeType: imageType, ext: imageExt } = await resizeImageForRecipe(rawImageBuffer, mime);

      const systemPromptMic = `Du bist ein Koch-Assistent. Extrahiere aus dem Bild und dem gesprochenen Text ein strukturiertes Rezept.
Antworte NUR mit einem JSON-Objekt in diesem Format:
{"title":"Rezeptname","ingredients":[{"amount":"Menge","unit":"Einheit","name":"Zutat"}],"steps":["Schritt 1","Schritt 2"],"category":"backen oder kochen","tags":["vegan","schnell"]}
- category: "backen" für Kuchen, Kekse, Brot; "kochen" für Suppen, Hauptgerichte.
- tags: optional Array, z.B. ["vegan"], ["schnell"] wenn zutreffend.
- Für amount und unit: leere Zeichenkette "" verwenden, wenn keine Angabe möglich ist.
- Für category: "" verwenden wenn unklar; sonst "backen" oder "kochen".
- Für tags: leeres Array [] wenn keine Tags zutreffen.
Schätze fehlende Mengen mit "ca." wenn nötig. Alle Texte auf Deutsch. Antworte ausschließlich mit dem JSON-Objekt, kein anderer Text.`;

      let content: string;
      try {
        content = await chatCompletion({
          systemPrompt: systemPromptMic,
          userMessage: `Gesprochener Text:\n${transcript}`,
          imageBase64: imageBuffer.toString("base64"),
          imageMimeType: imageType,
        });
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Die KI konnte das Rezept nicht extrahieren. Bitte Bild und Aufnahme prüfen.",
        };
      }
      if (!content?.trim()) {
        return { success: false, error: "Keine Antwort von der KI" };
      }

      let jsonStr = extractRecipeJson(content);
      if (!jsonStr) {
        jsonStr = content.match(/\{[\s\S]*\}/)?.[0] ?? null;
      }
      if (!jsonStr) {
        console.error("createRecipe: GPT content without JSON:", content?.slice(0, 500));
        return {
          success: false,
          error: content.startsWith("I'm sorry")
            ? "Die KI konnte das Rezept nicht extrahieren. Bitte Bild und Aufnahme prüfen."
            : "Ungültige Antwort der KI. Bitte erneut versuchen.",
        };
      }
      recipe = JSON.parse(jsonStr);

      const uploadsDir = path.join(process.cwd(), "uploads");
      await mkdir(uploadsDir, { recursive: true });
      imageFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${imageExt}`;
      await writeFile(path.join(uploadsDir, imageFilename), imageBuffer);
    }

    if (!recipe.title || !recipe.ingredients || !recipe.steps) {
      return { success: false, error: "Ungültiges Rezept-Format" };
    }

    const userId = session?.user?.id ?? null;

    const category = recipe.category === "backen" || recipe.category === "kochen" ? recipe.category : null;
    const tags = Array.isArray(recipe.tags) && recipe.tags.length > 0 ? JSON.stringify(recipe.tags) : null;
    const servingsRaw = formData.get("servings");
    const servings =
      servingsRaw != null && String(servingsRaw).trim() !== ""
        ? Math.max(1, parseInt(String(servingsRaw), 10) || 4)
        : 4;

    await prisma.recipe.create({
      data: {
        title: recipe.title,
        imagePath: imageFilename,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
        category,
        tags,
        userId,
        servings,
      },
    });

    const recipeCount = userId ? await prisma.recipe.count({ where: { userId } }) : 0;
    return { success: true, recipeCount: recipeCount > 0 ? recipeCount : undefined };
  } catch (err) {
    console.error("createRecipe error:", err);
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

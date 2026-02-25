"use server";

import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export type RecipeInput = {
  title: string;
  ingredients: Array<{ amount?: string; unit?: string; name: string }>;
  steps: string[];
};

export async function createRecipe(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "OPENAI_API_KEY nicht konfiguriert" };
    }

    const imageFile = formData.get("image") as File | null;
    const audioFile = formData.get("audio") as File | null;

    if (!imageFile?.size || !audioFile?.size) {
      return { success: false, error: "Bitte Foto und Sprachaufnahme hinzufügen." };
    }

    // 1. Whisper: Audio → Text
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "de",
    });

    const transcript = transcription.text;

    // 2. GPT-4o: Bild + Text → strukturiertes JSON
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageType = imageFile.type;
    const imageExt = imageType.split("/")[1] || "jpg";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Du bist ein Koch-Assistent. Extrahiere aus dem Bild und dem gesprochenen Text ein strukturiertes Rezept.
Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Code-Block) in diesem Format:
{"title":"Rezeptname","ingredients":[{"amount":"Menge","unit":"Einheit","name":"Zutat"}],"steps":["Schritt 1","Schritt 2"]}
Schätze fehlende Mengen mit "ca." wenn nötig. Alle Texte auf Deutsch.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Gesprochener Text:\n${transcript}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageType};base64,${imageBuffer.toString("base64")}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return { success: false, error: "Keine Antwort von der KI" };
    }

    // JSON parsen (evtl. Code-Block entfernen)
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const recipe: RecipeInput = JSON.parse(jsonStr);

    if (!recipe.title || !recipe.ingredients || !recipe.steps) {
      return { success: false, error: "Ungültiges Rezept-Format" };
    }

    // 3. Bild speichern
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${imageExt}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, imageBuffer);

    // 4. In DB speichern
    await prisma.recipe.create({
      data: {
        title: recipe.title,
        imagePath: filename,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
      },
    });

    return { success: true };
  } catch (err) {
    console.error("createRecipe error:", err);
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

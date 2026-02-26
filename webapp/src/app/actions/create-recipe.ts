"use server";

import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getOpenAIClient, getOpenAIApiKey } from "@/lib/openai";
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

export async function createRecipe(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return { success: false, error: "OpenAI API Key nicht konfiguriert. Bitte in Admin → Settings hinterlegen." };
    }

    const openai = await getOpenAIClient();
    const mode = (formData.get("mode") as string) || "mic";
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

      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `Du bist ein Koch-Assistent. Extrahiere aus dem folgenden Rezept-Text ein strukturiertes Rezept.
Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Code-Block) in diesem Format:
{"title":"Rezeptname","ingredients":[{"amount":"Menge","unit":"Einheit","name":"Zutat"}],"steps":["Schritt 1","Schritt 2"],"category":"backen oder kochen","tags":["vegan","schnell"]}
- category: "backen" für Kuchen, Kekse, Brot, Teig; "kochen" für Suppen, Hauptgerichte, Salate.
- tags: optional Array, z.B. ["vegan"], ["vegetarisch"], ["schnell"] wenn zutreffend.
Schätze fehlende Mengen mit "ca." wenn nötig. Alle Texte auf Deutsch.`,
        },
      ];

      let resizedImage: { buffer: Buffer; mimeType: string; ext: string } | null = null;
      if (imageFile?.size) {
        const rawBuffer = Buffer.from(await imageFile.arrayBuffer());
        const mime = imageFile.type || "image/jpeg";
        resizedImage = await resizeImageForRecipe(rawBuffer, mime);
        messages.push({
          role: "user",
          content: [
            { type: "text", text: `Rezept-Notiz:\n${noteText.trim()}` },
            {
              type: "image_url",
              image_url: {
                url: `data:${resizedImage.mimeType};base64,${resizedImage.buffer.toString("base64")}`,
              },
            },
          ],
        });
      } else {
        messages.push({
          role: "user",
          content: `Rezept-Notiz:\n${noteText.trim()}`,
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 1024,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        return { success: false, error: "Keine Antwort von der KI" };
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          error: content.startsWith("I'm sorry")
            ? "Die KI konnte das Rezept nicht extrahieren. Bitte Bild und Text prüfen."
            : "Ungültige Antwort der KI. Bitte erneut versuchen.",
        };
      }
      recipe = JSON.parse(jsonMatch[0]);

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

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Du bist ein Koch-Assistent. Extrahiere aus dem Bild und dem gesprochenen Text ein strukturiertes Rezept.
Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Code-Block) in diesem Format:
{"title":"Rezeptname","ingredients":[{"amount":"Menge","unit":"Einheit","name":"Zutat"}],"steps":["Schritt 1","Schritt 2"],"category":"backen oder kochen","tags":["vegan","schnell"]}
- category: "backen" für Kuchen, Kekse, Brot; "kochen" für Suppen, Hauptgerichte.
- tags: optional Array, z.B. ["vegan"], ["schnell"] wenn zutreffend.
Schätze fehlende Mengen mit "ca." wenn nötig. Alle Texte auf Deutsch.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Gesprochener Text:\n${transcript}` },
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

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          error: content.startsWith("I'm sorry")
            ? "Die KI konnte das Rezept nicht extrahieren. Bitte Bild und Aufnahme prüfen."
            : "Ungültige Antwort der KI. Bitte erneut versuchen.",
        };
      }
      recipe = JSON.parse(jsonMatch[0]);

      const uploadsDir = path.join(process.cwd(), "uploads");
      await mkdir(uploadsDir, { recursive: true });
      imageFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${imageExt}`;
      await writeFile(path.join(uploadsDir, imageFilename), imageBuffer);
    }

    if (!recipe.title || !recipe.ingredients || !recipe.steps) {
      return { success: false, error: "Ungültiges Rezept-Format" };
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const category = recipe.category === "backen" || recipe.category === "kochen" ? recipe.category : null;
    const tags = Array.isArray(recipe.tags) && recipe.tags.length > 0 ? JSON.stringify(recipe.tags) : null;

    await prisma.recipe.create({
      data: {
        title: recipe.title,
        imagePath: imageFilename,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
        category,
        tags,
        userId,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("createRecipe error:", err);
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

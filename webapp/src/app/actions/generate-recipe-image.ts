"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/image-generation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Generate a recipe image via Replicate (Bild-API Key) and optionally attach it to a recipe.
 * Prompt is built from title and optional main ingredients.
 */
export async function generateRecipeImage(params: {
  recipeId?: string;
  title: string;
  mainIngredients?: string;
}): Promise<{ success: boolean; imagePath?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Nicht angemeldet." };
    }

    const buffer = await generateImage(
      `Appetitliches Rezeptfoto, Food-Fotografie, ${params.title}${params.mainIngredients ? `, Zutaten: ${params.mainIngredients}` : ""}, hochwertig, gut beleuchtet`
    );
    if (!buffer) {
      return {
        success: false,
        error: "Bild-API Key nicht konfiguriert oder Generierung fehlgeschlagen. Bitte in Admin → Settings prüfen.",
      };
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    await writeFile(path.join(uploadsDir, filename), buffer);

    if (params.recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: params.recipeId },
        select: { userId: true },
      });
      const isOwner = recipe?.userId === session.user.id;
      const isAdmin = session.user.role === "ADMIN";
      if (recipe && (isOwner || isAdmin)) {
        await prisma.recipe.update({
          where: { id: params.recipeId },
          data: { imagePath: filename },
        });
      }
    }

    return { success: true, imagePath: filename };
  } catch (err) {
    console.error("generateRecipeImage error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bildgenerierung fehlgeschlagen.",
    };
  }
}

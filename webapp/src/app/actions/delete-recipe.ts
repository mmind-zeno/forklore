"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

export async function deleteRecipe(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Nicht angemeldet." };
    }

    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      return { success: false, error: "Rezept nicht gefunden." };
    }

    await prisma.recipe.delete({ where: { id } });

    if (recipe.imagePath) {
      const uploadsDir = path.join(process.cwd(), "uploads");
      const filePath = path.join(uploadsDir, recipe.imagePath);
      try {
        await unlink(filePath);
      } catch {
        // ignore if file missing
      }
    }

    return { success: true };
  } catch (err) {
    console.error("deleteRecipe error:", err);
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

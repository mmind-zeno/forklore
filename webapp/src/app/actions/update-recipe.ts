"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { resizeImageForRecipe } from "@/lib/image-resize";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function updateRecipe(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userRole = session?.user?.role ?? "USER";
    if (!userId) return { success: false, error: "Nicht angemeldet." };

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Rezept nicht gefunden." };
    }

    const isOwner = existing.userId != null && existing.userId === userId;
    const isAdmin = userRole === "ADMIN";
    if (!isOwner && !isAdmin) {
      return { success: false, error: "Keine Berechtigung, dieses Rezept zu bearbeiten." };
    }

    const title = (formData.get("title") as string)?.trim();
    const ingredientsStr = formData.get("ingredients") as string;
    const stepsStr = formData.get("steps") as string;
    const category = (formData.get("category") as string) || null;
    const tagsStr = formData.get("tags") as string;
    const visibilityInput = (formData.get("visibility") as string) || "";
    const mainIngredientsStr = formData.get("mainIngredients") as string;
    const imageFile = formData.get("image") as File | null;
    const servingsRaw = formData.get("servings");
    const servings =
      servingsRaw != null && String(servingsRaw).trim() !== ""
        ? Math.max(1, parseInt(String(servingsRaw), 10) || 4)
        : existing.servings ?? 4;

    if (!title) {
      return { success: false, error: "Titel fehlt." };
    }

    let ingredients: Array<{ amount?: string; unit?: string; name: string }>;
    let steps: string[];
    try {
      ingredients = JSON.parse(ingredientsStr || "[]") as Array<{ amount?: string; unit?: string; name: string }>;
      steps = JSON.parse(stepsStr || "[]") as string[];
    } catch {
      return { success: false, error: "Ungültiges Format für Zutaten oder Schritte." };
    }

    if (ingredients.length === 0 || steps.length === 0) {
      return { success: false, error: "Mindestens eine Zutat und ein Schritt erforderlich." };
    }

    const categoryVal = category === "backen" || category === "kochen" ? category : null;
    let tagsVal: string | null = null;
    if (tagsStr?.trim()) {
      try {
        const parsed = JSON.parse(tagsStr) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          tagsVal = JSON.stringify(parsed);
        }
      } catch {
        // tags optional
      }
    }

    const visibilityVal =
      visibilityInput === "public" || visibilityInput === "private" ? visibilityInput : existing.visibility ?? "private";

    let mainIngredientsVal: string | null = existing.mainIngredients ?? null;
    if (mainIngredientsStr?.trim()) {
      try {
        const parsed = JSON.parse(mainIngredientsStr) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          mainIngredientsVal = JSON.stringify(parsed);
        }
      } catch {
        // optional Feld – Fehler ignorieren
      }
    } else {
      mainIngredientsVal = null;
    }

    let imagePath = existing.imagePath;

    if (imageFile?.size) {
      const uploadsDir = path.join(process.cwd(), "uploads");
      await mkdir(uploadsDir, { recursive: true });
      const rawBuffer = Buffer.from(await imageFile.arrayBuffer());
      const mime = imageFile.type || "image/jpeg";
      const resized = await resizeImageForRecipe(rawBuffer, mime);
      const newFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${resized.ext}`;
      await writeFile(path.join(uploadsDir, newFilename), resized.buffer);

      if (existing.imagePath) {
        const oldPath = path.join(uploadsDir, existing.imagePath);
        try {
          await unlink(oldPath);
        } catch {
          // ignore
        }
      }
      imagePath = newFilename;
    }

    await prisma.recipe.update({
      where: { id },
      data: {
        title,
        ingredients: JSON.stringify(ingredients),
        steps: JSON.stringify(steps),
        category: categoryVal,
        tags: tagsVal,
        imagePath,
        visibility: visibilityVal,
        mainIngredients: mainIngredientsVal,
        servings,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("updateRecipe error:", err);
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}

"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** weekStart = "YYYY-MM-DD" (Monday), dayOfWeek 0–6 (Mon–Sun), recipeId null = Eintrag entfernen */
export async function setMealPlanEntry(
  weekStart: string,
  dayOfWeek: number,
  recipeId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Nicht angemeldet." };
    }
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return { success: false, error: "Ungültiger Wochentag." };
    }
    const start = new Date(weekStart);
    if (Number.isNaN(start.getTime())) {
      return { success: false, error: "Ungültiges Datum." };
    }

    const existing = await prisma.mealPlanEntry.findUnique({
      where: {
        userId_weekStart_dayOfWeek: {
          userId: session.user.id,
          weekStart: start,
          dayOfWeek,
        },
      },
    });

    if (recipeId === null) {
      if (existing) {
        await prisma.mealPlanEntry.delete({ where: { id: existing.id } });
      }
      return { success: true };
    }

    // Rezept muss für User sichtbar sein (eigenes oder öffentlich)
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        OR: [{ userId: session.user.id }, { visibility: "public" }],
      },
    });
    if (!recipe) {
      return { success: false, error: "Rezept nicht gefunden oder keine Berechtigung." };
    }

    if (existing) {
      await prisma.mealPlanEntry.update({
        where: { id: existing.id },
        data: { recipeId },
      });
    } else {
      await prisma.mealPlanEntry.create({
        data: {
          userId: session.user.id,
          weekStart: start,
          dayOfWeek,
          recipeId,
        },
      });
    }
    return { success: true };
  } catch (err) {
    console.error("setMealPlanEntry error:", err);
    return { success: false, error: "Speichern fehlgeschlagen." };
  }
}

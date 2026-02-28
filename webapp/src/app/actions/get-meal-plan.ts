"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** weekStart = "YYYY-MM-DD" (Monday) */
export async function getMealPlan(weekStart: string): Promise<{
  success: boolean;
  entries?: { dayOfWeek: number; recipeId: string; recipe: { id: string; title: string; imagePath: string | null } }[];
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
      where: {
        userId: session.user.id,
        weekStart: start,
      },
      include: {
        recipe: { select: { id: true, title: true, imagePath: true } },
      },
      orderBy: { dayOfWeek: "asc" },
    });

    return {
      success: true,
      entries: entries.map((e) => ({
        dayOfWeek: e.dayOfWeek,
        recipeId: e.recipeId,
        recipe: e.recipe,
      })),
    };
  } catch (err) {
    console.error("getMealPlan error:", err);
    return { success: false, error: "Laden fehlgeschlagen." };
  }
}

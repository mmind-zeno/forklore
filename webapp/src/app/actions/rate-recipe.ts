"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function rateRecipe(recipeId: string, stars: number): Promise<{
  success: boolean;
  error?: string;
  average?: number;
  count?: number;
  stars?: number;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Nicht angemeldet." };
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return { success: false, error: "Ungültige Bewertung." };
    }

    const userId = session.user.id;

    await prisma.rating.upsert({
      where: { recipeId_userId: { recipeId, userId } },
      update: { stars },
      create: { recipeId, userId, stars },
    });

    const agg = await prisma.rating.aggregate({
      where: { recipeId },
      _avg: { stars: true },
      _count: { stars: true },
    });

    return {
      success: true,
      average: agg._avg.stars ?? 0,
      count: agg._count.stars,
      stars,
    };
  } catch (err) {
    console.error("rateRecipe error:", err);
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return { success: false, error: msg };
  }
}


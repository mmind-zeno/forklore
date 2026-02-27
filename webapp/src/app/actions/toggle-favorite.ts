"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleFavorite(recipeId: string): Promise<{ success: boolean; isFavorite: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, isFavorite: false, error: "Nicht angemeldet." };
    }

    const existing = await prisma.userFavorite.findUnique({
      where: { userId_recipeId: { userId: session.user.id, recipeId } },
    });

    if (existing) {
      await prisma.userFavorite.delete({
        where: { id: existing.id },
      });
      return { success: true, isFavorite: false };
    }

    await prisma.userFavorite.create({
      data: { userId: session.user.id, recipeId },
    });
    return { success: true, isFavorite: true };
  } catch (err) {
    console.error("toggleFavorite error:", err);
    return { success: false, isFavorite: false, error: "Aktion fehlgeschlagen." };
  }
}

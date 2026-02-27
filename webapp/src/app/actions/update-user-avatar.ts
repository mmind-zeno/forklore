"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resizeImageForAvatar } from "@/lib/image-resize";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function updateUserAvatar(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Nicht angemeldet." };
    }

    const file = formData.get("avatar") as File | null;
    if (!file?.size || !file.type.startsWith("image/")) {
      return { success: false, error: "Bitte ein Bild (JPG, PNG, WebP) auswählen." };
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const { buffer, ext } = await resizeImageForAvatar(rawBuffer, mime);

    const userId = session.user.id;
    const newFilename = `avatar-${userId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, newFilename);
    await writeFile(filePath, buffer);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPath: true },
    });

    if (user?.avatarPath) {
      const oldPath = path.join(uploadsDir, user.avatarPath);
      try {
        await unlink(oldPath);
      } catch {
        // ignore if file missing
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatarPath: newFilename },
    });

    return { success: true };
  } catch (err) {
    console.error("updateUserAvatar error:", err);
    return { success: false, error: "Profilbild konnte nicht gespeichert werden." };
  }
}

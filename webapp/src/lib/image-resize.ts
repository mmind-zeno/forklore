import sharp from "sharp";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const TARGET_BYTES = 90 * 1024; // 90 KB
const MAX_SIDE = 1200;

/** Resize/compress image to ~90 KB for OpenAI Vision API. */
export async function resizeImageForRecipe(
  buffer: Buffer,
  fallbackMimeType = "image/jpeg"
): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  try {
    const pipeline = sharp(buffer)
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true });

    // Convert to JPEG for smaller size (PNG/WebP → JPEG)
    const mimeType = "image/jpeg";
    const ext = "jpg";

    let quality = 85;
    let result = await pipeline.jpeg({ quality }).toBuffer();

    while (result.length > TARGET_BYTES && quality > 40) {
      quality -= 15;
      result = await sharp(buffer)
        .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();
    }

    return { buffer: result, mimeType, ext };
  } catch (err) {
    console.error("resizeImageForRecipe error:", err);
    const ext = MIME_TO_EXT[fallbackMimeType] || "jpg";
    return { buffer, mimeType: fallbackMimeType, ext };
  }
}

const AVATAR_SIZE = 200;

/** Resize image to square avatar (200x200). */
export async function resizeImageForAvatar(
  buffer: Buffer,
  fallbackMimeType = "image/jpeg"
): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  try {
    const mimeType = "image/jpeg";
    const ext = "jpg";
    const result = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer();
    return { buffer: result, mimeType, ext };
  } catch (err) {
    console.error("resizeImageForAvatar error:", err);
    const ext = MIME_TO_EXT[fallbackMimeType] || "jpg";
    return { buffer, mimeType: fallbackMimeType, ext };
  }
}

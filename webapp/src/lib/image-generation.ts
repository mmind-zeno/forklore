import { InferenceClient } from "@huggingface/inference";
import { prisma } from "./prisma";

const IMAGE_API_KEY = "image_api_key";
const REPLICATE_FLUX = "black-forest-labs/flux-schnell";
const HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";
const HF_PROVIDER = "hf-inference" as const;
const HF_RETRY_ATTEMPTS = 3;
const HF_RETRY_DELAY_MS = 20_000;
const FOOD_PROMPT_SUFFIX =
  " professional food photography, high resolution, detailed, studio lighting, appetizing, 4k";

export async function getImageApiKey(): Promise<string | undefined> {
  const s = await prisma.setting.findUnique({ where: { key: IMAGE_API_KEY } });
  if (s?.value) return s.value;
  return (
    process.env.REPLICATE_API_TOKEN ??
    process.env.HUGGINGFACE_API_KEY ??
    process.env.IMAGE_API_KEY
  );
}

function isReplicateKey(key: string): boolean {
  return key.trim().toLowerCase().startsWith("r8_");
}

function isHuggingFaceKey(key: string): boolean {
  return key.trim().toLowerCase().startsWith("hf_");
}

/**
 * Generate an image via Hugging Face Inference (router API, FLUX). Retries up to 3 times
 * with 20s delay on 503 / model loading. Returns image as Buffer or null on failure.
 */
export async function generateImageWithHuggingFace(
  prompt: string,
  apiKey: string
): Promise<Buffer | null> {
  const fullPrompt = prompt + FOOD_PROMPT_SUFFIX;
  const client = new InferenceClient(apiKey.trim());

  for (let attempt = 1; attempt <= HF_RETRY_ATTEMPTS; attempt++) {
    try {
      const blob = await client.textToImage({
        model: HF_MODEL,
        inputs: fullPrompt,
        provider: HF_PROVIDER,
      });
      const blobLike = blob as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> };
      if (!blobLike?.arrayBuffer) {
        console.error("Hugging Face did not return a blob");
        return null;
      }
      const arrayBuffer = await blobLike.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const is503 =
        msg.includes("503") ||
        msg.includes("loading") ||
        msg.includes("Loading");
      if (is503 && attempt < HF_RETRY_ATTEMPTS) {
        console.warn(
          `Hugging Face model loading, retry ${attempt}/${HF_RETRY_ATTEMPTS} in ${HF_RETRY_DELAY_MS / 1000}s`
        );
        await new Promise((r) => setTimeout(r, HF_RETRY_DELAY_MS));
        continue;
      }
      console.error("Hugging Face inference failed:", msg);
      return null;
    }
  }

  return null;
}

/**
 * Generate an image via Replicate (flux-schnell). Returns image as Buffer (PNG) or null on failure.
 */
export async function generateImageWithReplicate(prompt: string): Promise<Buffer | null> {
  const token = await getImageApiKey();
  if (!token?.trim()) return null;

  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({
      version: REPLICATE_FLUX,
      input: { prompt },
    }),
  });

  if (!res.ok) {
    console.error("Replicate prediction failed:", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as { output?: string | string[]; status?: string };
  if (data.status !== "succeeded") {
    console.error("Replicate prediction not succeeded:", data.status);
    return null;
  }

  const output = data.output;
  const url = Array.isArray(output) ? output[0] : output;
  if (!url || typeof url !== "string") {
    console.error("Replicate no image URL in output:", output);
    return null;
  }

  const imgRes = await fetch(url);
  if (!imgRes.ok) return null;
  const arrayBuffer = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate an image using the configured API key: Replicate (r8_...) or Hugging Face (hf_...).
 * Returns image as Buffer or null on failure.
 */
export async function generateImage(prompt: string): Promise<Buffer | null> {
  const key = await getImageApiKey();
  if (!key?.trim()) return null;

  if (isReplicateKey(key)) {
    return generateImageWithReplicate(prompt);
  }
  if (isHuggingFaceKey(key)) {
    return generateImageWithHuggingFace(prompt, key);
  }
  // Default to Hugging Face if key is set but no known prefix (e.g. from env HUGGINGFACE_API_KEY)
  return generateImageWithHuggingFace(prompt, key);
}

import { prisma } from "./prisma";

const IMAGE_API_KEY = "image_api_key";
const REPLICATE_FLUX = "black-forest-labs/flux-schnell";
const NANOBANANA_BASE = "https://api.nanobananaapi.ai/api/v1/nanobanana";
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 35; // ~70s max

export async function getImageApiKey(): Promise<string | undefined> {
  const s = await prisma.setting.findUnique({ where: { key: IMAGE_API_KEY } });
  if (s?.value) return s.value;
  return process.env.REPLICATE_API_TOKEN ?? process.env.IMAGE_API_KEY;
}

/** Replicate tokens typically start with r8_. Otherwise we use NanoBanana. */
function isReplicateKey(key: string): boolean {
  return key.trim().toLowerCase().startsWith("r8_");
}

/**
 * Generate an image via NanoBanana (TEXTTOIMAGE). Uses callBackUrl + polling record-info.
 * Returns image as Buffer (PNG) or null on failure.
 */
export async function generateImageWithNanoBanana(
  prompt: string,
  apiKey: string
): Promise<Buffer | null> {
  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://forklore.mmind.space");
  const callBackUrl = `${baseUrl}/api/webhooks/nanobanana`;

  const res = await fetch(`${NANOBANANA_BASE}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      type: "TEXTTOIAMGE",
      callBackUrl,
      numImages: 1,
    }),
  });

  if (!res.ok) {
    console.error("NanoBanana generate failed:", res.status, await res.text());
    return null;
  }

  const gen = (await res.json()) as { taskId?: string; code?: number; msg?: string };
  const taskId = gen.taskId;
  if (!taskId || typeof taskId !== "string") {
    console.error("NanoBanana no taskId:", gen);
    return null;
  }

  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const infoRes = await fetch(
      `${NANOBANANA_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      }
    );
    if (!infoRes.ok) {
      console.error("NanoBanana record-info failed:", infoRes.status);
      continue;
    }

    const info = (await infoRes.json()) as {
      data?: {
        successFlag?: number;
        response?: { resultImageUrl?: string };
        errorMessage?: string;
      };
    };
    const flag = info.data?.successFlag;
    if (flag === 2 || flag === 3) {
      console.error("NanoBanana task failed:", info.data?.errorMessage ?? info);
      return null;
    }
    if (flag === 1 && info.data?.response?.resultImageUrl) {
      const imgRes = await fetch(info.data.response.resultImageUrl);
      if (!imgRes.ok) return null;
      const arrayBuffer = await imgRes.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  }

  console.error("NanoBanana polling timeout for taskId:", taskId);
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
 * Generate an image using the configured API key: Replicate (key r8_...) or NanoBanana.
 * Returns image as Buffer (PNG) or null on failure.
 */
export async function generateImage(prompt: string): Promise<Buffer | null> {
  const key = await getImageApiKey();
  if (!key?.trim()) return null;

  if (isReplicateKey(key)) {
    return generateImageWithReplicate(prompt);
  }
  return generateImageWithNanoBanana(prompt, key);
}

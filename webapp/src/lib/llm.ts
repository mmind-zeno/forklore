import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "./prisma";
import { getOpenAIClient } from "./openai";

const KEYS = {
  LLM_PROVIDER: "llm_provider",
  GEMINI_MODEL: "gemini_model",
  GEMINI: "gemini_api_key",
} as const;

export type LlmProvider = "openai" | "gemini";

export async function getLlmProvider(): Promise<LlmProvider> {
  const s = await prisma.setting.findUnique({ where: { key: KEYS.LLM_PROVIDER } });
  return s?.value === "gemini" ? "gemini" : "openai";
}

const GEMINI_MODEL_ALIASES: Record<string, string> = {
  "gemini-3.0-pro": "gemini-3-pro-preview",
};

export async function getGeminiModel(): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { key: KEYS.GEMINI_MODEL } });
  const raw = s?.value?.trim() || "gemini-2.5-flash";
  return GEMINI_MODEL_ALIASES[raw] ?? raw;
}

export async function getGeminiApiKey(): Promise<string | undefined> {
  const s = await prisma.setting.findUnique({ where: { key: KEYS.GEMINI } });
  if (s?.value) return s.value;
  return process.env.GEMINI_API_KEY;
}

export type ChatCompletionParams = {
  systemPrompt: string;
  userMessage: string;
  imageBase64?: string;
  imageMimeType?: string;
};

/** Returns the raw text response from the configured LLM (OpenAI or Gemini). */
export async function chatCompletion(params: ChatCompletionParams): Promise<string> {
  const { systemPrompt, userMessage, imageBase64, imageMimeType } = params;
  const provider = await getLlmProvider();

  if (provider === "openai") {
    const openai = await getOpenAIClient();
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          imageBase64 && imageMimeType
            ? [
                { type: "text" as const, text: userMessage },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: `data:${imageMimeType};base64,${imageBase64}`,
                    detail: "low" as const,
                  },
                },
              ]
            : userMessage,
      },
    ];
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1536,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("Keine Antwort von OpenAI");
    return text;
  }

  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API Key nicht konfiguriert. Bitte in Admin → Settings hinterlegen.");
  const modelId = await getGeminiModel();
  const ai = new GoogleGenAI({ apiKey });

  const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  if (imageBase64 && imageMimeType) {
    contents.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
  }
  contents.push({ text: userMessage });

  const res = await ai.models.generateContent({
    model: modelId,
    config: { systemInstruction: systemPrompt },
    contents,
  });

  const text = res.text?.trim();
  if (!text) throw new Error("Keine Antwort von Gemini");
  return text;
}

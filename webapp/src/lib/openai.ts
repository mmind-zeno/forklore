import OpenAI from "openai";
import { prisma } from "./prisma";

const OPENAI_KEY = "openai_api_key";

export async function getOpenAIApiKey(): Promise<string | undefined> {
  const setting = await prisma.setting.findUnique({
    where: { key: OPENAI_KEY },
  });
  if (setting?.value) return setting.value;
  return process.env.OPENAI_API_KEY;
}

export async function getOpenAIClient(): Promise<OpenAI> {
  const key = await getOpenAIApiKey();
  return new OpenAI({ apiKey: key });
}

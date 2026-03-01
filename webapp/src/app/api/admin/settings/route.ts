import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const KEYS = {
  OPENAI: "openai_api_key",
  GEMINI: "gemini_api_key",
  IMAGE: "image_api_key",
  LLM_PROVIDER: "llm_provider",
  GEMINI_MODEL: "gemini_model",
} as const;

function maskKey(value: string): string {
  if (!value || value.length < 12) return "***";
  return `${value.slice(0, 4)}${"*".repeat(Math.min(value.length - 8, 20))}${value.slice(-4)}`;
}

async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

/** Map deprecated model IDs to current Gemini API names. */
function normalizeGeminiModel(value: string): string {
  if (value === "gemini-3.0-pro") return "gemini-3-pro-preview";
  return value;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const [openaiApiKey, geminiApiKey, imageApiKey, llmProvider, geminiModel] = await Promise.all([
      getSetting(KEYS.OPENAI),
      getSetting(KEYS.GEMINI),
      getSetting(KEYS.IMAGE),
      getSetting(KEYS.LLM_PROVIDER),
      getSetting(KEYS.GEMINI_MODEL),
    ]);
    return NextResponse.json({
      openaiApiKey: openaiApiKey ? maskKey(openaiApiKey) : null,
      openaiConfigured: !!openaiApiKey,
      geminiApiKey: geminiApiKey ? maskKey(geminiApiKey) : null,
      geminiConfigured: !!geminiApiKey,
      imageApiKey: imageApiKey ? maskKey(imageApiKey) : null,
      imageApiConfigured: !!imageApiKey,
      llmProvider: llmProvider || "openai",
      geminiModel: normalizeGeminiModel(geminiModel || "gemini-2.5-flash"),
    });
  } catch (error) {
    console.error("Admin settings get error:", error);
    return NextResponse.json(
      { error: "Einstellungen konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.openaiApiKey !== undefined) {
      const value = typeof body.openaiApiKey === "string" ? body.openaiApiKey.trim() : "";
      if (value === "") {
        await prisma.setting.deleteMany({ where: { key: KEYS.OPENAI } });
      } else if (value.startsWith("sk-")) {
        await prisma.setting.upsert({
          where: { key: KEYS.OPENAI },
          create: { key: KEYS.OPENAI, value },
          update: { value },
        });
      } else {
        return NextResponse.json(
          { error: "Ungültiger OpenAI API Key (sollte mit sk- beginnen)" },
          { status: 400 }
        );
      }
    }

    if (body.geminiApiKey !== undefined) {
      const value = typeof body.geminiApiKey === "string" ? body.geminiApiKey.trim() : "";
      if (value === "") {
        await prisma.setting.deleteMany({ where: { key: KEYS.GEMINI } });
      } else {
        await prisma.setting.upsert({
          where: { key: KEYS.GEMINI },
          create: { key: KEYS.GEMINI, value },
          update: { value },
        });
      }
    }

    if (body.imageApiKey !== undefined) {
      const value = typeof body.imageApiKey === "string" ? body.imageApiKey.trim() : "";
      if (value === "") {
        await prisma.setting.deleteMany({ where: { key: KEYS.IMAGE } });
      } else {
        await prisma.setting.upsert({
          where: { key: KEYS.IMAGE },
          create: { key: KEYS.IMAGE, value },
          update: { value },
        });
      }
    }

    if (body.llmProvider !== undefined) {
      const value = body.llmProvider === "gemini" ? "gemini" : "openai";
      await prisma.setting.upsert({
        where: { key: KEYS.LLM_PROVIDER },
        create: { key: KEYS.LLM_PROVIDER, value },
        update: { value },
      });
    }

    if (body.geminiModel !== undefined && typeof body.geminiModel === "string" && body.geminiModel.trim()) {
      const value = body.geminiModel.trim();
      await prisma.setting.upsert({
        where: { key: KEYS.GEMINI_MODEL },
        create: { key: KEYS.GEMINI_MODEL, value },
        update: { value },
      });
    }

    return NextResponse.json({ message: "Einstellungen gespeichert" });
  } catch (error) {
    console.error("Admin settings patch error:", error);
    return NextResponse.json(
      { error: "Einstellungen konnten nicht gespeichert werden" },
      { status: 500 }
    );
  }
}

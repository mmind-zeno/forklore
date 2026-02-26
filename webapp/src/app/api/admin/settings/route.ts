import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const OPENAI_KEY = "openai_api_key";

function maskKey(value: string): string {
  if (!value || value.length < 12) return "***";
  return `${value.slice(0, 4)}${"*".repeat(Math.min(value.length - 8, 20))}${value.slice(-4)}`;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: OPENAI_KEY },
    });
    const openaiApiKey = setting?.value ?? null;
    return NextResponse.json({
      openaiApiKey: openaiApiKey ? maskKey(openaiApiKey) : null,
      openaiConfigured: !!openaiApiKey,
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
    const { openaiApiKey } = body;

    if (openaiApiKey === undefined) {
      return NextResponse.json(
        { error: "openaiApiKey ist erforderlich" },
        { status: 400 }
      );
    }

    const value = typeof openaiApiKey === "string" ? openaiApiKey.trim() : "";

    if (value === "") {
      await prisma.setting.deleteMany({ where: { key: OPENAI_KEY } });
      return NextResponse.json({ message: "OpenAI API Key entfernt" });
    }

    if (!value.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Ungültiger OpenAI API Key (sollte mit sk- beginnen)" },
        { status: 400 }
      );
    }

    await prisma.setting.upsert({
      where: { key: OPENAI_KEY },
      create: { key: OPENAI_KEY, value },
      update: { value },
    });

    return NextResponse.json({ message: "OpenAI API Key gespeichert" });
  } catch (error) {
    console.error("Admin settings patch error:", error);
    return NextResponse.json(
      { error: "Einstellungen konnten nicht gespeichert werden" },
      { status: 500 }
    );
  }
}

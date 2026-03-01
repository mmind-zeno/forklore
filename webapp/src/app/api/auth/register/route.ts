import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const TRIAL_DAYS = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Passwort ist erforderlich" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen haben" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ein Konto mit dieser E-Mail existiert bereits." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    const accountAccessUntil = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hash,
        name: name?.trim() || null,
        role: "USER",
        accountAccessUntil,
        aiAccessUntil: null,
      },
    });

    return NextResponse.json({
      message: "Konto erstellt. Du kannst dich jetzt anmelden.",
      accountAccessUntil: accountAccessUntil.toISOString(),
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen. Bitte später erneut versuchen." },
      { status: 500 }
    );
  }
}

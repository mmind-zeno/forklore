import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        accountAccessUntil: true,
        aiAccessUntil: true,
        _count: { select: { recipes: true } },
      },
    });
    return NextResponse.json({
      users: users.map(({ _count, ...u }) => ({
        ...u,
        recipeCount: _count.recipes,
      })),
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "User konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, role } = body;

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

    const validRole = role === "ADMIN" ? "ADMIN" : "USER";
    const hash = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ein User mit dieser E-Mail existiert bereits" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hash,
        name: name?.trim() || null,
        role: validRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user, message: "User angelegt" });
  } catch (error) {
    console.error("Admin user create error:", error);
    return NextResponse.json(
      { error: "User konnte nicht angelegt werden" },
      { status: 500 }
    );
  }
}

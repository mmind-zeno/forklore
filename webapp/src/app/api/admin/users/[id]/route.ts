import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { recipes: true } },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json({
    ...user,
    recipeCount: user._count.recipes,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { email, name, role, password } = body;

  const updateData: {
    email?: string;
    name?: string | null;
    role?: string;
    password?: string;
  } = {};

  if (typeof email === "string" && email.trim()) {
    updateData.email = email.trim().toLowerCase();
  }
  if (typeof name === "string") {
    updateData.name = name.trim() || null;
  }
  if (role === "ADMIN" || role === "USER") {
    updateData.role = role;
  }
  if (typeof password === "string" && password.length >= 8) {
    updateData.password = await bcrypt.hash(password, 12);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ user, message: "User aktualisiert" });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "E-Mail bereits vergeben" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "User konnte nicht aktualisiert werden" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { id } = await params;

  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (targetUser?.role === "ADMIN" && adminCount <= 1) {
    return NextResponse.json(
      { error: "Letzter Admin kann nicht gelöscht werden" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User gelöscht" });
  } catch {
    return NextResponse.json(
      { error: "User konnte nicht gelöscht werden" },
      { status: 500 }
    );
  }
}

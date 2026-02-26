import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password.trim() : "";
    const expected = (process.env.ADMIN_PASSWORD || "").trim();

    if (!expected) {
      return NextResponse.json(
        { error: "Admin nicht konfiguriert (ADMIN_PASSWORD fehlt)" },
        { status: 500 }
      );
    }

    if (password !== expected) {
      return NextResponse.json(
        { error: "Falsches Passwort" },
        { status: 401 }
      );
    }

    await setAdminCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Login" },
      { status: 500 }
    );
  }
}

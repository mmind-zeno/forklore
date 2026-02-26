import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "forklore-admin-secret"
);
const COOKIE_NAME = "forklore_admin";

export async function setAdminCookie() {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function removeAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdmin(): Promise<
  { authorized: true } | { authorized: false; error: string }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return { authorized: false, error: "Nicht eingeloggt" };
  }

  try {
    await jwtVerify(token, SECRET);
    return { authorized: true };
  } catch {
    return { authorized: false, error: "Session abgelaufen" };
  }
}

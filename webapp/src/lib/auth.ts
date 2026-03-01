import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "forklore-dev-secret",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await prisma.$connect();
        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true, password: true, accountAccessUntil: true, aiAccessUntil: true },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        const now = new Date();
        if (user.accountAccessUntil && user.accountAccessUntil < now) {
          return null; // Zugang abgelaufen – Login verweigert
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role ?? "USER",
          accountAccessUntil: user.accountAccessUntil?.toISOString() ?? null,
          aiAccessUntil: user.aiAccessUntil?.toISOString() ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; email?: string; role?: string; accountAccessUntil?: string | null; aiAccessUntil?: string | null };
        token.id = u.id;
        token.email = u.email ?? undefined;
        token.role = u.role ?? "USER";
        token.accountAccessUntil = u.accountAccessUntil ?? null;
        token.aiAccessUntil = u.aiAccessUntil ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role ?? "USER";
        session.user.accountAccessUntil = token.accountAccessUntil ?? null;
        session.user.aiAccessUntil = token.aiAccessUntil ?? null;
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { avatarPath: true },
        });
        session.user.image = user?.avatarPath ? `/api/uploads/${user.avatarPath}` : null;
      }
      return session;
    },
  },
};

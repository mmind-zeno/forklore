"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const LOGIN_TIMEOUT_MS = 20000;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const signInPromise = signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), LOGIN_TIMEOUT_MS)
      );
      const res = await Promise.race([signInPromise, timeoutPromise]);
      if (res?.error) {
        setError("Ungültige E-Mail oder Passwort.");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message === "TIMEOUT"
          ? "Die Anmeldung dauert zu lange. Bitte erneut versuchen."
          : "Ein Fehler ist aufgetreten."
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-amber-50 via-orange-50/90 via-teal-50/40 to-rose-50/60">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-xl font-bold text-stone-800 group-hover:text-coral-600 transition-colors">Forklore</span>
          </Link>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-200 shadow-xl shadow-coral-500/5 p-8">
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Anmelden</h1>
          <p className="text-stone-600 text-sm mb-6">
            Melde dich an, um deine Rezepte zu verwalten.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-coral-500/30 focus:border-coral-500"
                placeholder="deine@email.de"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1.5">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-coral-500/30 focus:border-coral-500"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-coral-500 to-coral-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-coral-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Wird angemeldet…" : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden…</div>}>
      <LoginForm />
    </Suspense>
  );
}

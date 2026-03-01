"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Registrierung fehlgeschlagen.");
        setLoading(false);
        return;
      }
      router.push("/login?registered=1");
      router.refresh();
    } catch {
      setError("Ein Fehler ist aufgetreten.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="font-display italic text-2xl font-bold text-espresso group-hover:text-terra transition-colors">
              Forklore
            </span>
          </Link>
        </div>
        <div className="bg-warmwhite rounded-2xl border border-espresso/6 shadow-card p-8">
          <h1 className="font-display text-2xl font-bold text-espresso mb-2">Registrieren</h1>
          <p className="text-espresso-mid text-sm mb-6">
            Erstelle ein Konto und erhalte 10 Tage Zugang zur App (ohne KI-Funktionen). Ein Admin kann dir später KI-Zugang einrichten.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-espresso mb-1.5">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-espresso/10 bg-cream text-espresso placeholder:text-espresso-light focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra transition"
                placeholder="deine@email.de"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-espresso mb-1.5">
                Passwort (min. 8 Zeichen)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-espresso/10 bg-cream text-espresso placeholder:text-espresso-light focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra transition"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-espresso mb-1.5">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-espresso/10 bg-cream text-espresso placeholder:text-espresso-light focus:outline-none focus:ring-2 focus:ring-terra/20 focus:border-terra transition"
                placeholder="Dein Name"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl font-bold">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-cta text-white rounded-xl font-bold shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Wird erstellt…" : "Konto erstellen"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-espresso-mid">
            Bereits ein Konto?{" "}
            <Link href="/login" className="font-bold text-terra hover:underline">
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";

export function HeaderWithAuth() {
  const { data: session } = useSession();

  return (
    <div className="relative sticky top-0 z-10 bg-white/85 backdrop-blur-xl border-b border-stone-200/60 px-4 py-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="block">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-stone-800 tracking-tight hover:text-coral-600 transition-colors"
            >
              Forklore
            </motion.h1>
          </Link>
          <nav className="flex gap-3 mt-1">
            <Link href="/" className="text-sm text-stone-600 hover:text-coral-500 transition-colors">Rezepte</Link>
            <Link href="/vegan" className="text-sm text-stone-600 hover:text-emerald-600 transition-colors">🌱 Vegan</Link>
            <Link href="/?category=backen" className="text-sm text-stone-600 hover:text-amber-600 transition-colors">Backen</Link>
            <Link href="/?category=kochen" className="text-sm text-stone-600 hover:text-teal-600 transition-colors">Kochen</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {session?.user?.email && (
            <span className="text-sm text-stone-500 hidden sm:inline">
              {session.user.email}
            </span>
          )}
          <Link
            href="/admin"
            className="text-sm text-stone-500 hover:text-coral-500 transition-colors font-medium"
          >
            Admin
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-stone-500 hover:text-coral-500 transition-colors font-medium"
          >
            Abmelden
          </button>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Link
          href="/add"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-coral-500 to-coral-600 px-6 py-3 text-white font-semibold shadow-lg shadow-coral-500/30 transition-all hover:shadow-coral-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="text-lg">+</span> Neues Rezept
        </Link>
      </motion.div>
    </div>
  );
}

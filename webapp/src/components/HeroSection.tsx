"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type HeroSectionProps = {
  heroImagePath?: string | null;
  backenCount?: number;
  kochenCount?: number;
};

export function HeroSection({ heroImagePath, backenCount = 0, kochenCount = 0 }: HeroSectionProps) {
  const slogan = "Willkommen in meiner Küche";
  const description = "Deine Rezepte – schnell erfasst, für immer bewahrt. Schreib eine Notiz oder sprich dein nächstes Rezept ein.";

  const container = {
    hidden: { opacity: 0 },
    visible: () => ({
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.1 },
    }),
  };

  const letter = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative w-full min-h-[55vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {heroImagePath ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${heroImagePath}`}
              alt=""
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-espresso/75 via-espresso/50 to-espresso/90"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-sage/25 via-cream via-warmwhite/95 to-honey/20"
            aria-hidden
          />
        )}
      </div>

      {/* Content overlay */}
      <div className={`relative z-10 px-6 sm:px-8 py-16 md:py-20 text-center max-w-4xl mx-auto ${heroImagePath ? "" : "text-espresso"}`}>
        <motion.h1
          className={`font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight ${heroImagePath ? "text-white drop-shadow-lg" : "text-espresso"}`}
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {slogan.split("").map((char, i) => (
            <motion.span key={i} variants={letter} className="inline-block">
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className={`mt-6 text-lg sm:text-xl font-body max-w-2xl mx-auto ${heroImagePath ? "text-white/95 drop-shadow-md" : "text-espresso-mid"}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {description}
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <Link
            href="/add"
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ${heroImagePath ? "bg-white text-espresso" : "bg-gradient-cta text-white"}`}
          >
            + Neues Rezept
          </Link>
          {(backenCount > 0 || kochenCount > 0) && (
            <div className={`flex items-center gap-6 text-sm font-bold ${heroImagePath ? "text-white/90" : "text-espresso-mid"}`}>
              <span className="flex items-center gap-2">
                <span className="text-xl">🥐</span>
                {backenCount} Backen
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xl">🍳</span>
                {kochenCount} Kochen
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

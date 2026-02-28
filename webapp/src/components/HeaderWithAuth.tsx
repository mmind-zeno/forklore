"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

export function HeaderWithAuth() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Rezepte" },
    { href: "/?category=backen", label: "Backen" },
    { href: "/?category=kochen", label: "Kochen" },
    { href: "/tips", label: "Tips & Tricks" },
    ...(session?.user ? [{ href: "/plan", label: "Wochenplan" }] : []),
  ];

  const category = searchParams.get("category");
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" && !pathname.includes("recipe") && !pathname.includes("edit");
    if (href === "/tips") return pathname === "/tips";
    if (href === "/plan") return pathname === "/plan";
    if (href === "/?category=backen") return category === "backen";
    if (href === "/?category=kochen") return category === "kochen";
    return false;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-cream/95 backdrop-blur-xl border-b border-terra/10 shadow-soft"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className={`mx-auto max-w-6xl px-6 transition-all duration-300 ${isScrolled ? "py-3" : "py-4"}`}>
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-3 group" aria-label="Forklore Startseite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-forklore.png"
              alt="Forklore"
              className="h-14 w-auto drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-display italic text-3xl text-espresso font-bold group-hover:text-terra transition-colors duration-200 leading-none">
              Forklore
            </span>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-body font-bold text-sm tracking-wide uppercase transition-colors duration-200 relative ${
                  isActive(link.href)
                    ? "text-terra after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-cta after:rounded-full"
                    : "text-espresso-mid hover:text-terra"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User + CTA Desktop */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {session?.user && (
              <Link
                href="/profile"
                className="flex items-center gap-2 text-espresso-light hover:text-terra transition-colors"
                title="Profil"
              >
                {session.user.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-espresso/10"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-cream-dark flex items-center justify-center text-espresso-mid text-xs font-bold">
                    {(session.user.name || session.user.email || "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="text-xs truncate max-w-[120px]">{session.user.email}</span>
              </Link>
            )}
            <span className="text-espresso-light/30 mx-1">|</span>
            <Link
              href="/admin"
              className="text-sm font-bold text-espresso hover:text-terra transition-colors"
            >
              Admin
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-espresso-light hover:text-terra transition-colors"
              aria-label="Abmelden"
            >
              Abmelden
            </button>
            <Link
              href="/add"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 text-white text-sm font-bold tracking-wide shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-200"
            >
              <Plus size={16} />
              Neues Rezept
            </Link>
          </div>

          {/* Hamburger Mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex flex-col justify-center gap-1.5"
            aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
          >
            <span
              className={`block h-0.5 bg-espresso transition-all ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span className={`block h-0.5 bg-espresso transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span
              className={`block h-0.5 bg-espresso transition-all ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-cream z-40 flex flex-col items-center justify-center gap-8 pt-20">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-display text-2xl italic text-espresso hover:text-terra transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="font-display text-xl italic text-espresso hover:text-terra transition-colors"
          >
            Profil
          </Link>
          <Link
            href="/add"
            onClick={() => setMobileOpen(false)}
            className="font-display text-xl italic text-terra font-bold"
          >
            + Neues Rezept
          </Link>
        </div>
      )}
    </header>
  );
}

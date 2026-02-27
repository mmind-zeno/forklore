import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";

const VERSION = "0.6.2";
const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-auto bg-espresso text-cream/65 pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="font-display italic text-2xl text-cream font-bold hover:text-honey-light transition-colors">
              Forklore
            </Link>
            <p className="text-sm leading-relaxed mt-3 max-w-[220px]">
              Rezepte per Notiz, Foto und Sprache erfassen. Mit KI strukturiert.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center transition-all duration-300 hover:bg-terra hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center transition-all duration-300 hover:bg-terra hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h3 className="font-display italic text-cream text-lg mb-5">Schnelllinks</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/" className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200">
                  Rezepte
                </Link>
              </li>
              <li>
                <Link href="/?category=backen" className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200">
                  Backen
                </Link>
              </li>
              <li>
                <Link href="/?category=kochen" className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200">
                  Kochen
                </Link>
              </li>
              <li>
                <Link href="/tips" className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200">
                  Tips & Tricks
                </Link>
              </li>
              <li>
                <Link href="/add" className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200">
                  Neues Rezept
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h3 className="font-display italic text-cream text-lg mb-5">Kategorien</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/?category=backen" className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200">
                  Backen
                </Link>
              </li>
              <li>
                <Link href="/?category=kochen" className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200">
                  Kochen
                </Link>
              </li>
              <li>
                <Link href="/tips" className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200">
                  Tips & Tricks
                </Link>
              </li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h3 className="font-display italic text-cream text-lg mb-5">Rechtliches</h3>
            <ul className="space-y-1">
              <li>
                <a
                  href="https://mmind.ai/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200"
                >
                  Impressum
                </a>
              </li>
              <li>
                <a
                  href="https://mmind.ai/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200"
                >
                  Datenschutz
                </a>
              </li>
              <li>
                <a
                  href="https://mmind.ai/disclaimer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-cream/60 text-sm py-1 hover:text-honey-light hover:pl-1 transition-all duration-200"
                >
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Förderer & Kooperation */}
        <div className="border-t border-cream/10 pt-8 pb-6">
          <div className="flex flex-wrap justify-center items-center gap-8 mb-6">
            <a
              href="https://erasmus-plus.ec.europa.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              title="Co-funded by the Erasmus+ Programme of the European Union"
            >
              <img
                src="/logo-erasmus.svg"
                alt="Erasmus+"
                className="h-10 w-auto"
              />
            </a>
            <a
              href="https://vegaluna.li"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              title="Kooperation mit vegAluna.li"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-vegaluna.png"
                alt="vegAluna.li – Zentrum pflanzlicher Ernährung"
                className="h-12 w-auto"
              />
            </a>
          </div>
          <p className="text-center text-xs text-cream/40 mb-4">
            Gefördert durch Erasmus+ · Kooperation mit vegAluna.li
          </p>
        </div>

        <div className="border-t border-cream/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-cream/35">
          <span>© {YEAR} <a href="https://mmind.ai" target="_blank" rel="noopener noreferrer" className="text-terra hover:text-terra-light transition-colors">mmind.ai</a> · Forklore v{VERSION}</span>
          <span>Gemacht mit ♥ und viel Mehl</span>
        </div>
      </div>
    </footer>
  );
}

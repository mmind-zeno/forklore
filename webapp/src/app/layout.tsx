import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Footer } from "@/components/Footer";
import { ScrollRevealProvider } from "@/components/ScrollRevealProvider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
});

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Forklore – Meine Rezepte",
  description: "Rezepte per Notiz, Foto und Sprache erfassen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${playfair.variable} ${lato.variable}`}>
      <body className="antialiased font-sans text-espresso-mid bg-cream min-h-screen flex flex-col leading-relaxed">
        <Providers>
          <ScrollRevealProvider>
            <div className="flex-1 flex flex-col">{children}</div>
          </ScrollRevealProvider>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

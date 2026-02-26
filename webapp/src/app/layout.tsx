import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Footer } from "@/components/Footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
    <html lang="de" className={outfit.variable}>
      <body className="antialiased font-sans bg-stone-50 min-h-screen flex flex-col">
        <Providers>
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

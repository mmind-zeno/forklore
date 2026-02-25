import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meine Rezepte",
  description: "Rezepte per Foto und Sprache erfassen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

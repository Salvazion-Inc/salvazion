import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Salvazion | Make Salvation, Health and Freedom Great Again",
  description: "Phalanx digital que une Salvación, Salud y Libertad. Defendemos la Cultura Occidental Cristiana y BioConservadurismo.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-black text-white min-h-screen font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

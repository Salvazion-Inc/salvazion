import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/Providers";
import PwaRegister from "@/components/PwaRegister";
import { APP_URL } from "@/lib/config/site";
import { getThemeBootScript } from "@/lib/store/theme";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || APP_URL
  ),
  title: {
    default: "Salvazion | Make Salvation, Health and Freedom Great Again",
    template: "%s | Salvazion",
  },
  description:
    "Comunidad digital que une Salvación, Salud y Libertad. Defendemos la Cultura Occidental Cristiana y BioConservadurismo.",
  applicationName: "Salvazion",
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Salvazion",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
    ],
    shortcut: ["/icon-192.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#040404" },
    { media: "(prefers-color-scheme: light)", color: "#8FD99A" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="bg-[var(--true-black)] text-[var(--off-white)] min-h-screen font-sans overflow-x-hidden">
        {/* Apply saved text scale + theme early to avoid FOUC */}
        <Script
          id="salvazion-boot-prefs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='salvazion_text_scale';var s=localStorage.getItem(k);if(s==='md'||s==='lg'||s==='xl'||s==='xxl'){document.documentElement.dataset.textScale=s;var m={md:16,lg:18,xl:20,xxl:22};var px=m[s]||16;document.documentElement.style.fontSize=px+'px';document.documentElement.style.setProperty('--app-text-scale',String(px/16));}var L=localStorage.getItem('salvazion_locale');if(L==='es'||L==='en'){document.documentElement.lang=L;document.documentElement.dataset.locale=L;}}catch(e){}})();${getThemeBootScript()}`,
          }}
        />
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}

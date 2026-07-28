import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/Providers";
import PwaRegister from "@/components/PwaRegister";
import { getAppBaseUrl } from "@/lib/config/site";
import { SEO } from "@/lib/seo/config";
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

const metadataBase = new URL(
  (process.env.NEXT_PUBLIC_APP_URL || getAppBaseUrl()).replace(/\/$/, "") ||
    SEO.url
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: SEO.title,
    template: SEO.titleTemplate,
  },
  description: SEO.description,
  applicationName: SEO.siteName,
  authors: [
    { name: "Cristian Cortés", url: SEO.url },
    { name: "Beatriz Isler", url: SEO.url },
  ],
  creator: SEO.legalName,
  publisher: SEO.legalName,
  category: SEO.category,
  keywords: [...SEO.keywords],
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      es: "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: SEO.locale,
    alternateLocale: [SEO.alternateLocale],
    url: "/",
    siteName: SEO.siteName,
    title: SEO.title,
    description: SEO.description,
    // Image: app/opengraph-image.tsx (auto-injected by Next.js)
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.title,
    description: SEO.description,
    // Image: app/twitter-image.tsx
    creator: SEO.twitterHandle,
    site: SEO.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SEO.siteName,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
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
  manifest: "/manifest.webmanifest",
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

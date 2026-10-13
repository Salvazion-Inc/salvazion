import type { Metadata } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import './dashboard.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { absolute: 'Tablero de fundadores · Salvazion' },
  description: 'Catálogo en vivo de Salvazion, Kaenz y Mapucoin. Solo fundadores.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function FoundersDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${fraunces.variable} ${outfit.variable}`}>{children}</div>;
}

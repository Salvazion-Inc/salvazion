import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Wallet adapter packages ship mixed CJS/ESM
  transpilePackages: [
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-phantom",
    "@solana/wallet-adapter-solflare",
  ],
  // Security headers — baseline for a production-facing app
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              // Supabase + Solana RPC + wallet endpoints
              [
                "connect-src 'self'",
                "https://*.supabase.co",
                "wss://*.supabase.co",
                "https://*.solana.com",
                "https://api.mainnet-beta.solana.com",
                "https://api.devnet.solana.com",
                "https://*.helius-rpc.com",
                "wss://*.helius-rpc.com",
                "https://*.helius.xyz",
                "https://*.quiknode.pro",
                "https://*.alchemy.com",
                "https://rpc.ankr.com",
                "https://*.phantom.app",
                "wss://*.phantom.app",
                "https://*.solflare.com",
                "https://jup.ag",
                "https://*.jup.ag",
              ].join(" "),
              "frame-src 'self' https://*.phantom.app https://*.solflare.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Images: allow local + future CDN
  images: {
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

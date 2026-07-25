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
            // Health sensors (PWA): GPS walks + DeviceMotion steps/activity.
            // Camera/mic stay blocked.
            value:
              "camera=(), microphone=(), geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Jupiter Terminal loads from terminal.jup.ag
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://terminal.jup.ag https://*.jup.ag",
              "style-src 'self' 'unsafe-inline' https://terminal.jup.ag https://*.jup.ag",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://terminal.jup.ag https://*.jup.ag",
              // Supabase + Solana RPC + wallets + Jupiter APIs
              [
                "connect-src 'self'",
                "https://*.supabase.co",
                "wss://*.supabase.co",
                "https://api.x.ai",
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
                "https://quote-api.jup.ag",
                "https://price.jup.ag",
                "https://api.jup.ag",
                "https://lite-api.jup.ag",
                "https://token.jup.ag",
                "https://stats.jup.ag",
                "https://cache.jup.ag",
                "https://worker.jup.ag",
                "wss://*.jup.ag",
              ].join(" "),
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-src 'self' https://*.phantom.app https://*.solflare.com https://jup.ag https://*.jup.ag https://terminal.jup.ag",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Images: allow local + Supabase storage avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

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
    "@jup-ag/jup-mobile-adapter",
    "@reown/appkit",
    "@reown/appkit-adapter-solana",
    "@reown/appkit-wallet-button",
    "@salvazion/capacitor-health",
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/splash-screen",
    "@capacitor/status-bar",
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
              "camera=(), microphone=(), geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self), bluetooth=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Jupiter Plugin (Ultra) — plugin.jup.ag; legacy terminal.jup.ag still allowed
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plugin.jup.ag https://terminal.jup.ag https://*.jup.ag",
              "style-src 'self' 'unsafe-inline' https://plugin.jup.ag https://terminal.jup.ag https://*.jup.ag https://fonts.googleapis.com https://fonts.reown.com",
              "img-src 'self' data: blob: https: https://images-na.ssl-images-amazon.com https://m.media-amazon.com https://covers.openlibrary.org https://books.google.com https://ipfs.io https://*.ipfs.io",
              "font-src 'self' data: https://plugin.jup.ag https://terminal.jup.ag https://*.jup.ag https://fonts.gstatic.com https://fonts.reown.com",
              // Supabase + Solana RPC + wallets + Jupiter APIs
              [
                "connect-src 'self'",
                "https://*.supabase.co",
                "wss://*.supabase.co",
                "https://api.x.ai",
                "https://openlibrary.org",
                "https://covers.openlibrary.org",
                "https://www.googleapis.com",
                "https://nominatim.openstreetmap.org",
                "https://overpass-api.de",
                "https://*.tile.openstreetmap.org",
                "https://unavatar.io",
                // Wearable OAuth + APIs
                "https://www.fitbit.com",
                "https://api.fitbit.com",
                "https://cloud.ouraring.com",
                "https://api.ouraring.com",
                "https://api.prod.whoop.com",
                "https://connect.garmin.com",
                "https://diauth.garmin.com",
                "https://apis.garmin.com",
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
                "https://plugin.jup.ag",
                "https://terminal.jup.ag",
                "https://quote-api.jup.ag",
                "https://price.jup.ag",
                "https://api.jup.ag",
                "https://lite-api.jup.ag",
                "https://token.jup.ag",
                "https://tokens.jup.ag",
                "https://stats.jup.ag",
                "https://cache.jup.ag",
                "https://worker.jup.ag",
                "https://ipfs.io",
                "https://*.ipfs.io",
                "wss://*.jup.ag",
                // WalletConnect / Reown (Jupiter Mobile QR)
                "https://*.walletconnect.com",
                "https://*.walletconnect.org",
                "wss://*.walletconnect.com",
                "wss://*.walletconnect.org",
                "https://*.reown.com",
                "https://api.web3modal.org",
                "https://pulse.walletconnect.org",
                "https://rpc.walletconnect.com",
                "https://rpc.walletconnect.org",
                "https://explorer-api.walletconnect.com",
                "https://verify.walletconnect.com",
                "https://verify.walletconnect.org",
              ].join(" "),
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-src 'self' https://*.phantom.app https://*.solflare.com https://jup.ag https://*.jup.ag https://plugin.jup.ag https://terminal.jup.ag https://verify.walletconnect.com https://verify.walletconnect.org https://*.walletconnect.com https://*.walletconnect.org https://www.openstreetmap.org https://openstreetmap.org",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Images: local + Supabase + X + Amazon / Open Library book covers
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.amazon.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "books.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "unavatar.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;

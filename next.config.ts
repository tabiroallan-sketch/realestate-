import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Every asset is local under /public/assets — no remote patterns needed.
    formats: ["image/avif", "image/webp"],
    // Next 16 restricts qualities to [75] unless configured; we serve crisp
    // architectural imagery at 75 and reserve 90 for the hero.
    qualities: [70, 75, 90],
    deviceSizes: [320, 375, 430, 640, 768, 1024, 1280, 1440, 1920, 2560],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
  },
  // Three.js / drei ship ESM that must not be pre-bundled by Turbopack.
  experimental: {
    optimizePackageImports: ["@react-three/drei", "gsap", "lenis"],
  },
};

export default nextConfig;
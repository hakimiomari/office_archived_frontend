import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Hide the dev-mode badge / route indicator in the bottom corner
  // (the small "N" with route activity that Next.js shows only in
  // `next dev`). Setting to `false` turns off both the static and
  // build-activity overlays. No effect on production builds.
  devIndicators: false,
};

export default nextConfig;

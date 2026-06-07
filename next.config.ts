// next.config.ts
// Next.js configuration file.

import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix turbopack root warning — point to this project's directory
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Allow Next.js <Image> to serve locally uploaded voter photos
  images: {
    remotePatterns: [],
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;

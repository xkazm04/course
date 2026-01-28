import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.leonardo.ai",
        pathname: "/users/**",
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: (process.env.BACKEND_INTERNAL_URL || "http://localhost:8000") + "/:path*",
      },
      {
        source: "/media-stream",
        destination: (process.env.BACKEND_INTERNAL_URL || "http://localhost:8000") + "/media-stream",
      },
    ]
  },
};

export default nextConfig;

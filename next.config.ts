import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true, // indien we styled-components gebruiken
  },
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "/index.html", // SPA fallback
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://www.paysdelaloire-tiralarc.fr",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://www.paysdelaloire-tiralarc.fr",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

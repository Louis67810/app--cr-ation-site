import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/ai-agents": ["./src/ai/skills/**/SKILL.md"],
    "/api/ai-agents/images/regenerate": ["./src/ai/skills/**/SKILL.md"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

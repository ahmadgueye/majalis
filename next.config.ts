import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Les couvertures passent par une server action ; le navigateur les réduit avant l'envoi (< 2 Mo).
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Sortie standalone : necessaire pour l'image Docker (Dockerfile a la
  // racine), qui ne copie que .next/standalone plutot que node_modules
  // en entier.
  output: "standalone",
  images: {
    remotePatterns: [{ hostname: "localhost" }]
  },
};

export default nextConfig;
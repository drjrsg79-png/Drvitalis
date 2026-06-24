import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El driver nativo de Netlify Database (@netlify/database) arrastra paquetes
  // server-only (pg, @neondatabase/serverless, ws). Next.js no debe empaquetarlos
  // con webpack; se cargan en tiempo de ejecucion desde node_modules.
  serverExternalPackages: ["@netlify/database", "pg", "@neondatabase/serverless"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;

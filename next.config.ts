import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "90mb",
    },
    // proxy.ts corre en cada request y por defecto solo lee los primeros
    // 10MB del body; sin esto, subidas de video quedan cortadas antes de
    // llegar al Server Action (error "Unexpected end of form").
    proxyClientMaxBodySize: "90mb",
  },
};

export default nextConfig;

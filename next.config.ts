// next.config.ts — Configure caching and keep Turbopack rooted in this project.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: { root: __dirname },
};
export default nextConfig;

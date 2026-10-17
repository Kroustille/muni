import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
<<<<<<< HEAD
  // Serwist injects webpack config; Next 16 defaults to Turbopack for `next build`.
  turbopack: {},
=======
  output: "standalone",
>>>>>>> 8d4ded8 (feat(deploy): production Docker image, Compose, and GHCR CI)
};

export default withSerwist(nextConfig);

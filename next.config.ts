import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  // Serwist injects webpack config; Next 16 defaults to Turbopack for `next build`.
  turbopack: {},
  output: "standalone",
};

export default withSerwist(nextConfig);

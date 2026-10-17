import nextConfig from "eslint-config-next";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "next-env.d.ts",
      "public/sw.js",
    ],
  },
  ...nextConfig,
  {
    rules: {
      // Next 16 / react-hooks v7: too strict for existing data-fetch-on-mount patterns (006).
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
];

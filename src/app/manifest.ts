import type { MetadataRoute } from "next";
import fr from "@/i18n/fr.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: fr["app.name"],
    short_name: fr["app.name"],
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

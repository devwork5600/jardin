import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Feuilles et épines",
    short_name: "Feuilles",
    description:
      "Jardinerie urbaine indépendante à Vannes — e-drive, retrait en boutique.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f1",
    theme_color: "#1b3226",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

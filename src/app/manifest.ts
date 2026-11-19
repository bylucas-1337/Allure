import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Allure — ton espace mouvement",
    short_name: "Allure",
    description: "Un espace simple et motivant pour suivre la course et la musculation.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f4",
    theme_color: "#f7f8f4",
    icons: [
      {
        src: "/icons/allure-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/allure-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

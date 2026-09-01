import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RAJPOOT TRADERS - Installment & Treasury Platform",
    short_name: "Rajpoot Traders",
    description: "Multi-Tenant Hire-Purchase, Field Recovery, and Treasury Management Platform for Rajpoot Traders.",
    start_url: "/portal",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#047857",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
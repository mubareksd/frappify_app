import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frappify",
    short_name: "Frappify",
    description: "Frappify workspace application",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff9f3",
    theme_color: "#dc6b2f",
    icons: [
      {
        src: "/frappe.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

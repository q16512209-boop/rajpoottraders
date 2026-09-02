import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rajpoottraders.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/calculator", "/products", "/blog", "/blog/*", "/verify"],
      disallow: ["/portal", "/portal/*", "/api/*", "/login"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
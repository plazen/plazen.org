import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Keep APIs and non-content routes out of the index
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: "https://plazen.org/sitemap.xml",
    host: "https://plazen.org",
  };
}

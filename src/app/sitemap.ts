import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://plazen.org";

  // Add your key public routes here. You can expand this as you add pages.
  const routes = [
    { url: base, changeFrequency: "daily", priority: 1 },
  ] as const;

  const lastModified = new Date();

  return routes.map((r) => ({
    url: r.url,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}

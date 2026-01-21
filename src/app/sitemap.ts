import { MetadataRoute } from "next";
import { getPublishedWritings } from "@/lib/writings";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://afterstill.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all published writings
  const writings = await getPublishedWritings();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/archive`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/fragment`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/atlas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/conduit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // Dynamic writing pages
  const writingPages: MetadataRoute.Sitemap = writings.map((writing) => ({
    url: `${BASE_URL}/reading/${writing.id}`,
    lastModified: writing.date ? new Date(writing.date) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...writingPages];
}

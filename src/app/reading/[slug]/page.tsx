import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getWritingBySlug, getPublishedWritings } from "@/lib/writings";
import ReadingClient from "./reading-client";
import {
  generateSEOMetadata,
  generateArticleSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://afterstill.com";

type ReadingPageProps = {
  params: Promise<{ slug: string }>;
};

// Generate metadata for each writing
export async function generateMetadata({
  params,
}: ReadingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const writing = await getWritingBySlug(slug);

  if (!writing) {
    return generateSEOMetadata({
      title: "Tulisan Tidak Ditemukan",
      description: "Tulisan yang kamu cari tidak dapat ditemukan.",
    });
  }

  return generateSEOMetadata({
    title: writing.title,
    description: writing.excerpt || `Baca "${writing.title}" di Afterstill`,
    keywords: writing.tags,
    url: `${BASE_URL}/reading/${writing.id}`,
    type: "article",
    publishedTime: writing.date,
    modifiedTime: writing.date,
    tags: writing.tags,
  });
}

// Generate static params for all published writings
export async function generateStaticParams() {
  const writings = await getPublishedWritings();
  return writings.map((writing) => ({
    slug: writing.id,
  }));
}

export default async function ReadingPage({ params }: ReadingPageProps) {
  const { slug } = await params;
  const writing = await getWritingBySlug(slug);

  if (!writing) {
    notFound();
  }

  // JSON-LD schemas
  const articleSchema = generateArticleSchema({
    title: writing.title,
    description: writing.excerpt || `Baca "${writing.title}" di Afterstill`,
    url: `${BASE_URL}/reading/${writing.id}`,
    publishedTime: writing.date || new Date().toISOString(),
    modifiedTime: writing.date,
    tags: writing.tags,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Beranda", url: BASE_URL },
    { name: "Arsip", url: `${BASE_URL}/archive` },
    { name: writing.title, url: `${BASE_URL}/reading/${writing.id}` },
  ]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <ReadingClient writing={writing} />
    </>
  );
}

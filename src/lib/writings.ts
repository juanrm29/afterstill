import prisma from "@/lib/db";
import { cache } from "react";

// Cached database queries for frontend
export const getPublishedWritings = cache(async () => {
  const writings = await prisma.writing.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return writings.map((w) => ({
    id: w.slug,
    title: w.title,
    date: w.publishedAt?.toISOString().split("T")[0] || w.createdAt.toISOString().split("T")[0],
    tags: w.tags.map((t) => t.tag.name),
    excerpt: w.excerpt || "",
    content: w.content,
  }));
});

export const getWritingBySlug = cache(async (slug: string) => {
  const writing = await prisma.writing.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!writing) return null;

  return {
    id: writing.slug,
    title: writing.title,
    date: writing.publishedAt?.toISOString().split("T")[0] || writing.createdAt.toISOString().split("T")[0],
    tags: writing.tags.map((t) => t.tag.name),
    excerpt: writing.excerpt || "",
    content: writing.content,
  };
});

export const getAllTags = cache(async () => {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { writings: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return tags.map((t) => ({
    name: t.name,
    slug: t.slug,
    count: t._count.writings,
  }));
});

export const getWritingsByTag = cache(async (tagSlug: string) => {
  const writings = await prisma.writing.findMany({
    where: {
      status: "PUBLISHED",
      tags: {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return writings.map((w) => ({
    id: w.slug,
    title: w.title,
    date: w.publishedAt?.toISOString().split("T")[0] || w.createdAt.toISOString().split("T")[0],
    tags: w.tags.map((t) => t.tag.name),
    excerpt: w.excerpt || "",
    content: w.content,
  }));
});

// Track page view
export async function trackPageView(slug: string) {
  try {
    const writing = await prisma.writing.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (writing) {
      await prisma.$transaction([
        prisma.pageView.create({
          data: { 
            path: `/reading/${slug}`,
            writingId: writing.id,
          },
        }),
        prisma.writing.update({
          where: { id: writing.id },
          data: { viewCount: { increment: 1 } },
        }),
      ]);
    }
  } catch (error) {
    console.error("Failed to track page view:", error);
  }
}

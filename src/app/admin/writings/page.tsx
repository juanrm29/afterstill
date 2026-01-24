import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import WritingsListClient from "./writings-list-client";

export default async function WritingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const writingsRaw = await prisma.writing.findMany({
    orderBy: { updatedAt: "desc" },
  });

  // Fetch tags for each writing separately
  const writingsWithTags = await Promise.all(
    writingsRaw.map(async (writing) => {
      const tagsOnWriting = await prisma.tagsOnWritings.findMany({
        where: { writingId: writing.id },
      });
      const tagIds = tagsOnWriting.map((t) => t.tagId);
      const tags = tagIds.length > 0 
        ? await prisma.tag.findMany({ where: { id: { in: tagIds } } })
        : [];
      
      return {
        ...writing,
        tags: tags.map((tag) => ({ tag })),
      };
    })
  );

  return <WritingsListClient writings={writingsWithTags} />;
}

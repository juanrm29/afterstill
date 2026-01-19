import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import TagsClient from "./tags-client";

export default async function TagsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Fetch tags and count separately due to Prisma Accelerate type limitations
  const tagsRaw = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  // Get writing counts for each tag
  const tagCounts = await Promise.all(
    tagsRaw.map(async (tag) => {
      const count = await prisma.tagsOnWritings.count({
        where: { tagId: tag.id },
      });
      return { tagId: tag.id, count };
    })
  );

  const countMap = new Map(tagCounts.map((tc) => [tc.tagId, tc.count]));

  const tags = tagsRaw.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    _count: {
      writings: countMap.get(tag.id) || 0,
    },
  }));

  return <TagsClient tags={tags} />;
}

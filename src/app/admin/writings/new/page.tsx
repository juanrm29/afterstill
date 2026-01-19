import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import WritingEditor from "../editor-client";

export default async function NewWritingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <WritingEditor
      mode="create"
      tags={tags}
      collections={collections}
      authorId={session.user.id!}
    />
  );
}

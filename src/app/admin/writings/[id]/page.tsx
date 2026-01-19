import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import WritingEditor from "../editor-client";

export default async function EditWritingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const writing = await prisma.writing.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!writing) {
    notFound();
  }

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <WritingEditor
      mode="edit"
      writing={writing}
      tags={tags}
      collections={collections}
      authorId={session.user.id!}
    />
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import CollectionsClient from "./collections-client";

export default async function CollectionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { writings: true },
      },
    },
  });

  return <CollectionsClient collections={collections} />;
}

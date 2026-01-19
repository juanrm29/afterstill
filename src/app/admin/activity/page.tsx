import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import ActivityClient from "./activity-client";

export default async function ActivityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const logs = await prisma.activityLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const parsed = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
  }));

  return <ActivityClient logs={parsed} />;
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import AdminDashboard from "./dashboard-client";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Fetch stats from Neon database
  const [writingsCount, publishedCount, draftsCount, viewsCount] = await Promise.all([
    prisma.writing.count(),
    prisma.writing.count({ where: { status: "PUBLISHED" } }),
    prisma.writing.count({ where: { status: "DRAFT" } }),
    prisma.pageView.count(),
  ]);

  // Fetch recent writings
  const recentWritings = await prisma.writing.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      viewCount: true,
    },
  });

  return (
    <AdminDashboard
      user={session.user}
      stats={{
        total: writingsCount,
        published: publishedCount,
        drafts: draftsCount,
        views: viewsCount,
      }}
      recentWritings={recentWritings}
    />
  );
}

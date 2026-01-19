import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/admin/analytics - Get analytics data
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "7d"; // 7d, 30d, 90d

  try {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Total views in period
    const totalViews = await prisma.pageView.count({
      where: { createdAt: { gte: startDate } },
    });

    // Unique visitors
    const uniqueVisitors = await prisma.pageView.groupBy({
      by: ["visitorId"],
      where: { 
        createdAt: { gte: startDate },
        visitorId: { not: null },
      },
    });

    // Average read progress
    const avgReadProgress = await prisma.pageView.aggregate({
      where: { 
        createdAt: { gte: startDate },
        readProgress: { not: null },
      },
      _avg: { readProgress: true },
    });

    // Average time on page
    const avgTimeOnPage = await prisma.pageView.aggregate({
      where: { 
        createdAt: { gte: startDate },
        timeOnPage: { not: null, gt: 0 },
      },
      _avg: { timeOnPage: true },
    });

    // Views by day
    const viewsByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "PageView"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Top writings by views
    const topWritings = await prisma.writing.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
      },
    });

    // Top referrers
    const topReferrers = await prisma.pageView.groupBy({
      by: ["referrer"],
      where: { 
        createdAt: { gte: startDate },
        referrer: { not: null },
      },
      _count: { referrer: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    });

    // Recent activity
    const recentViews = await prisma.pageView.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        path: true,
        visitorId: true,
        readProgress: true,
        timeOnPage: true,
        createdAt: true,
      },
    });

    // Total reflections
    const totalReflections = await prisma.reflection.count();

    // Recent reflections
    const recentReflections = await prisma.reflection.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        writingId: true,
        content: true,
        mood: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      overview: {
        totalViews,
        uniqueVisitors: uniqueVisitors.length,
        avgReadProgress: Math.round(avgReadProgress._avg.readProgress || 0),
        avgTimeOnPage: Math.round(avgTimeOnPage._avg.timeOnPage || 0),
        totalReflections,
      },
      viewsByDay: viewsByDay.map(v => ({
        date: v.date,
        count: Number(v.count),
      })),
      topWritings,
      topReferrers: topReferrers.map(r => ({
        referrer: r.referrer || "Direct",
        count: r._count.referrer,
      })),
      recentViews,
      recentReflections,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

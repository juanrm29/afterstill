import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

// Generate visitor ID
function generateVisitorId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// POST /api/analytics/track - Track page view
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path, writingId, readProgress, timeOnPage } = body;

    // Get or create visitor ID
    const cookieStore = await cookies();
    let visitorId = cookieStore.get("visitor_id")?.value;
    
    if (!visitorId) {
      visitorId = generateVisitorId();
    }

    // Get referrer and user agent from headers
    const referrer = request.headers.get("referer") || null;
    const userAgent = request.headers.get("user-agent") || null;

    // Create page view record
    const pageView = await prisma.pageView.create({
      data: {
        path,
        writingId: writingId || null,
        visitorId,
        referrer,
        userAgent,
        readProgress: readProgress || 0,
        timeOnPage: timeOnPage || 0,
      },
    });

    // If writingId provided, increment view count
    if (writingId) {
      await prisma.writing.update({
        where: { id: writingId },
        data: { viewCount: { increment: 1 } },
      });
    }

    const response = NextResponse.json({ success: true, id: pageView.id });
    
    // Set visitor cookie if new
    if (!cookieStore.get("visitor_id")?.value) {
      response.cookies.set("visitor_id", visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error("Failed to track page view:", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}

// PATCH /api/analytics/track - Update existing page view
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, readProgress, timeOnPage } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.pageView.update({
      where: { id },
      data: {
        readProgress: readProgress || undefined,
        timeOnPage: timeOnPage || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update page view:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

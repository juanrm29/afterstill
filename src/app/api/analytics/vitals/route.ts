import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/error-handling";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, rating, url, timestamp } = body;

    // Log web vitals
    logger.info("Web Vitals", {
      metric: name,
      value,
      rating,
      url,
      timestamp,
    });

    // In production, you might want to send this to an analytics service
    // like Google Analytics, Vercel Analytics, or a custom solution

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error("Failed to log web vitals", error as Error);
    return NextResponse.json(
      { error: "Failed to log vitals" },
      { status: 500 }
    );
  }
}

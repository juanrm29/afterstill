import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/error-handling";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log error to server
    logger.error("Client error", undefined, body);

    // In production, send to error tracking service (Sentry, etc.)
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to log error" },
      { status: 500 }
    );
  }
}

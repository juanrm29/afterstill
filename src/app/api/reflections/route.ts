import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";

// Get visitor ID from cookie or create new one
async function getVisitorId(): Promise<string> {
  const cookieStore = await cookies();
  let visitorId = cookieStore.get("visitor_id")?.value;
  
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
  
  return visitorId;
}

// POST - Create a new reflection
export async function POST(request: Request) {
  try {
    const { writingId, content, mood, isPublic } = await request.json();

    if (!writingId || !content) {
      return NextResponse.json(
        { error: "Writing ID and content are required" },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: "Reflection must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Reflection must be under 2000 characters" },
        { status: 400 }
      );
    }

    const visitorId = await getVisitorId();

    // Check if visitor already left a reflection for this writing
    const existing = await prisma.reflection.findFirst({
      where: { writingId, visitorId },
    });

    if (existing) {
      // Update existing reflection
      const reflection = await prisma.reflection.update({
        where: { id: existing.id },
        data: { content, mood, isPublic: isPublic ?? false },
      });
      
      return NextResponse.json({ 
        reflection, 
        updated: true,
        message: "Your reflection has been updated" 
      });
    }

    // Create new reflection
    const reflection = await prisma.reflection.create({
      data: {
        writingId,
        visitorId,
        content,
        mood,
        isPublic: isPublic ?? false,
      },
    });

    // Set visitor cookie if not exists
    const response = NextResponse.json({ 
      reflection, 
      updated: false,
      message: "Thank you for sharing your reflection" 
    });
    
    response.cookies.set("visitor_id", visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });

    return response;
  } catch (error) {
    console.error("Failed to save reflection:", error);
    return NextResponse.json(
      { error: "Failed to save reflection" },
      { status: 500 }
    );
  }
}

// GET - Get public reflections for a writing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const writingId = searchParams.get("writingId");

    if (!writingId) {
      return NextResponse.json(
        { error: "Writing ID is required" },
        { status: 400 }
      );
    }

    // Get public reflections
    const reflections = await prisma.reflection.findMany({
      where: {
        writingId,
        isPublic: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        content: true,
        mood: true,
        createdAt: true,
      },
    });

    // Get visitor's own reflection (even if not public)
    const visitorId = await getVisitorId();
    const ownReflection = await prisma.reflection.findFirst({
      where: { writingId, visitorId },
    });

    return NextResponse.json({ 
      reflections, 
      ownReflection,
      total: reflections.length 
    });
  } catch (error) {
    console.error("Failed to fetch reflections:", error);
    return NextResponse.json(
      { error: "Failed to fetch reflections" },
      { status: 500 }
    );
  }
}

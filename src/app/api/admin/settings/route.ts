import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/admin/settings - Get site settings
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get or create default settings
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "main" },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: "main" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/admin/settings - Update site settings
export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      siteName,
      siteTagline,
      siteDescription,
      oracleEnabled,
      radioEnabled,
      catalogEnabled,
      candleEnabled,
      nightStartHour,
      nightEndHour,
      twitterUrl,
      githubUrl,
      emailContact,
    } = body;

    const settings = await prisma.siteSettings.upsert({
      where: { id: "main" },
      update: {
        siteName,
        siteTagline,
        siteDescription,
        oracleEnabled,
        radioEnabled,
        catalogEnabled,
        candleEnabled,
        nightStartHour,
        nightEndHour,
        twitterUrl,
        githubUrl,
        emailContact,
      },
      create: {
        id: "main",
        siteName,
        siteTagline,
        siteDescription,
        oracleEnabled,
        radioEnabled,
        catalogEnabled,
        candleEnabled,
        nightStartHour,
        nightEndHour,
        twitterUrl,
        githubUrl,
        emailContact,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const settings = await prisma.siteSettings.update({
      where: { id: "main" },
      data: {
        aboutPronunciation: data.aboutPronunciation,
        aboutSection1Title: data.aboutSection1Title,
        aboutSection1Content: data.aboutSection1Content,
        aboutSection2Title: data.aboutSection2Title,
        aboutSection2Content: data.aboutSection2Content,
        aboutSection3Title: data.aboutSection3Title,
        aboutSection3Content: data.aboutSection3Content,
        aboutSection4Title: data.aboutSection4Title,
        aboutSection4Content: data.aboutSection4Content,
        aboutQuote: data.aboutQuote,
        aboutPrivacyNote: data.aboutPrivacyNote,
        aboutEstYear: data.aboutEstYear,
        twitterUrl: data.twitterUrl || null,
        githubUrl: data.githubUrl || null,
        instagramUrl: data.instagramUrl || null,
        emailContact: data.emailContact || null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id as string,
        action: "UPDATE",
        entity: "About",
        entityId: "main",
        details: JSON.stringify({ updated: Object.keys(data) }),
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to update about settings:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

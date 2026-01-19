import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/admin/writings - List all writings
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const writings = await prisma.writing.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(writings);
  } catch (error) {
    console.error("Failed to fetch writings:", error);
    return NextResponse.json({ error: "Failed to fetch writings" }, { status: 500 });
  }
}

// POST /api/admin/writings - Create new writing
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      status,
      tags,
      collectionId,
      radioFrequency,
      isNightOnly,
      isFeatured,
      scheduledAt,
      publishedAt,
      wordCount,
      readingTime,
      authorId,
    } = body;

    // Check slug uniqueness
    const existingSlug = await prisma.writing.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    // Create writing
    const writing = await prisma.writing.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        status,
        collectionId,
        radioFrequency,
        isNightOnly,
        isFeatured,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        wordCount,
        readingTime,
        authorId,
        tags: {
          create: tags?.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })) || [],
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Create initial version
    await prisma.writingVersion.create({
      data: {
        writingId: writing.id,
        title,
        content,
        excerpt,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: authorId,
        action: "CREATE",
        entity: "Writing",
        entityId: writing.id,
        details: JSON.stringify({ title, status }),
      },
    });

    return NextResponse.json(writing);
  } catch (error) {
    console.error("Failed to create writing:", error);
    return NextResponse.json({ error: "Failed to create writing" }, { status: 500 });
  }
}

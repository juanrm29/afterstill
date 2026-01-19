import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/admin/writings/[id] - Get single writing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const writing = await prisma.writing.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
          take: 10,
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

    if (!writing) {
      return NextResponse.json({ error: "Writing not found" }, { status: 404 });
    }

    return NextResponse.json(writing);
  } catch (error) {
    console.error("Failed to fetch writing:", error);
    return NextResponse.json({ error: "Failed to fetch writing" }, { status: 500 });
  }
}

// PUT /api/admin/writings/[id] - Update writing
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
    } = body;

    // Check if writing exists
    const existing = await prisma.writing.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Writing not found" }, { status: 404 });
    }

    // Check slug uniqueness (if changed)
    if (slug !== existing.slug) {
      const existingSlug = await prisma.writing.findUnique({
        where: { slug },
      });

      if (existingSlug) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    // Create version before updating (if content changed)
    if (content !== existing.content) {
      await prisma.writingVersion.create({
        data: {
          writingId: id,
          title: existing.title,
          content: existing.content,
          excerpt: existing.excerpt,
        },
      });
    }

    // Update writing
    const writing = await prisma.writing.update({
      where: { id },
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
        publishedAt: publishedAt ? new Date(publishedAt) : existing.publishedAt,
        wordCount,
        readingTime,
        tags: {
          deleteMany: {},
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "UPDATE",
        entity: "Writing",
        entityId: writing.id,
        details: JSON.stringify({ title, status }),
      },
    });

    return NextResponse.json(writing);
  } catch (error) {
    console.error("Failed to update writing:", error);
    return NextResponse.json({ error: "Failed to update writing" }, { status: 500 });
  }
}

// PATCH /api/admin/writings/[id] - Partial update (auto-save)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    const writing = await prisma.writing.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(writing);
  } catch (error) {
    console.error("Failed to update writing:", error);
    return NextResponse.json({ error: "Failed to update writing" }, { status: 500 });
  }
}

// DELETE /api/admin/writings/[id] - Delete writing
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get writing for logging
    const writing = await prisma.writing.findUnique({
      where: { id },
    });

    if (!writing) {
      return NextResponse.json({ error: "Writing not found" }, { status: 404 });
    }

    // Delete writing (cascades to versions and tags)
    await prisma.writing.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "DELETE",
        entity: "Writing",
        entityId: id,
        details: JSON.stringify({ title: writing.title }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete writing:", error);
    return NextResponse.json({ error: "Failed to delete writing" }, { status: 500 });
  }
}

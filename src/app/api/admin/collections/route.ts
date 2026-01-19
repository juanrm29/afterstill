import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/admin/collections - List all collections
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collections = await prisma.collection.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { writings: true },
        },
      },
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

// POST /api/admin/collections - Create new collection
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, coverImage } = body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check uniqueness
    const existing = await prisma.collection.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Collection already exists" }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        description,
        coverImage,
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Failed to create collection:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}

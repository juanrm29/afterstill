import { NextResponse } from "next/server";
import { getPublishedWritings } from "@/lib/writings";

export async function GET() {
  try {
    const writings = await getPublishedWritings();
    return NextResponse.json(writings);
  } catch (error) {
    console.error("Failed to fetch writings:", error);
    return NextResponse.json({ error: "Failed to fetch writings" }, { status: 500 });
  }
}

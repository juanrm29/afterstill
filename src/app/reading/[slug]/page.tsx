import { notFound } from "next/navigation";
import { getWritingBySlug, getPublishedWritings } from "@/lib/writings";
import ReadingClient from "./reading-client";

type ReadingPageProps = {
  params: Promise<{ slug: string }>;
};

// Generate static params for all published writings
export async function generateStaticParams() {
  const writings = await getPublishedWritings();
  return writings.map((writing) => ({
    slug: writing.id,
  }));
}

export default async function ReadingPage({ params }: ReadingPageProps) {
  const { slug } = await params;
  const writing = await getWritingBySlug(slug);

  if (!writing) {
    notFound();
  }

  return <ReadingClient writing={writing} />;
}

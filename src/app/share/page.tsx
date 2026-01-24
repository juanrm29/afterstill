import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Content - Afterstill",
  robots: "noindex",
};

interface SharePageProps {
  searchParams: Promise<{
    title?: string;
    text?: string;
    url?: string;
  }>;
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const { title, text, url } = params;

  // If no shared content, redirect to home
  if (!title && !text && !url) {
    redirect("/");
  }

  // For now, redirect to home with the shared data in URL
  // In the future, this could open a compose/save dialog
  const homeUrl = new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "https://afterstill.com");
  homeUrl.searchParams.set("shared", "true");
  if (title) homeUrl.searchParams.set("sharedTitle", title);
  if (text) homeUrl.searchParams.set("sharedText", text);
  if (url) homeUrl.searchParams.set("sharedUrl", url);

  redirect(homeUrl.pathname + homeUrl.search);
}

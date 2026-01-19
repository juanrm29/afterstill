import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import AboutClient from "./about-client";

export default async function AdminAboutPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Get or create default settings
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "main" },
  });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: "main" },
    });
  }

  return <AboutClient settings={settings} />;
}

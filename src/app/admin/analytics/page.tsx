import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AnalyticsDashboard from "./analytics-client";

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  return <AnalyticsDashboard />;
}

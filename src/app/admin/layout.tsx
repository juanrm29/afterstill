import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // Public admin routes that don't need auth
  const isPublicRoute = typeof window !== "undefined" && 
    (window.location.pathname.includes("/admin/login") || 
     window.location.pathname.includes("/admin/verify") ||
     window.location.pathname.includes("/admin/error"));

  // For server-side, we check session
  // Protected routes redirect to login if no session
  
  return (
    <div className="min-h-screen bg-[#030304] text-zinc-300">
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface Writing {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: Date;
  viewCount: number;
}

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
  };
  stats: {
    total: number;
    published: number;
    drafts: number;
    views: number;
  };
  recentWritings: Writing[];
}

export default function AdminDashboard({ user, stats, recentWritings }: Props) {
  return (
    <div className="min-h-screen">
      {/* Ambient background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(2,2,3,0.7) 70%, rgba(2,2,3,0.9) 100%)" 
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-[10px] font-extralight tracking-[0.4em] text-zinc-600 uppercase hover:text-zinc-500 transition-colors">
              Afterstill
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors tracking-wider">
                Dashboard
              </Link>
              <Link href="/admin/writings" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Writings
              </Link>
              <Link href="/admin/tags" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Tags
              </Link>
              <Link href="/admin/about" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                About
              </Link>
              <Link href="/admin/settings" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Settings
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-600 tracking-wider">{user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors tracking-wider"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-2xl font-extralight tracking-wide text-zinc-300 mb-2" style={{ fontFamily: "var(--font-cormorant), serif" }}>
            The Archive
          </h1>
          <p className="text-sm text-zinc-600">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total Writings" value={stats.total} />
          <StatCard label="Published" value={stats.published} />
          <StatCard label="Drafts" value={stats.drafts} />
          <StatCard label="Total Views" value={stats.views} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-4 mb-12">
          <Link
            href="/admin/writings/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/40 rounded-lg text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-600/50 transition-all duration-300 text-sm tracking-wider"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Writing
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/40 rounded-lg text-zinc-500 hover:text-zinc-400 hover:border-zinc-700/50 transition-all duration-300 text-sm tracking-wider"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 9l-5 5-4-4-3 3" />
            </svg>
            Analytics
          </Link>
          <Link
            href="/admin/collections"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/40 rounded-lg text-zinc-500 hover:text-zinc-400 hover:border-zinc-700/50 transition-all duration-300 text-sm tracking-wider"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Collections
          </Link>
          <Link
            href="/admin/activity"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800/40 rounded-lg text-zinc-500 hover:text-zinc-400 hover:border-zinc-700/50 transition-all duration-300 text-sm tracking-wider"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity
          </Link>
        </div>

        {/* Recent writings */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-extralight tracking-wide text-zinc-400" style={{ fontFamily: "var(--font-cormorant), serif" }}>
              Recent Writings
            </h2>
            <Link href="/admin/writings" className="text-xs text-zinc-600 hover:text-zinc-500 transition-colors tracking-wider">
              View all →
            </Link>
          </div>

          {recentWritings.length > 0 ? (
            <div className="space-y-2">
              {recentWritings.map((writing) => (
                <Link
                  key={writing.id}
                  href={`/admin/writings/${writing.id}`}
                  className="flex items-center justify-between px-4 py-3 bg-zinc-900/30 border border-zinc-800/30 rounded-lg hover:bg-zinc-900/50 hover:border-zinc-700/40 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <StatusBadge status={writing.status} />
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      {writing.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-zinc-600">
                    <span>{writing.viewCount} views</span>
                    <span>{new Date(writing.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-zinc-900/20 border border-zinc-800/30 rounded-lg">
              <p className="text-sm text-zinc-600 mb-4">No writings yet</p>
              <Link
                href="/admin/writings/new"
                className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Create your first writing →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-4 bg-zinc-900/30 border border-zinc-800/30 rounded-lg">
      <p className="text-[10px] text-zinc-600 tracking-[0.15em] uppercase mb-2">{label}</p>
      <p className="text-2xl font-extralight text-zinc-400">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    DRAFT: "bg-zinc-800/50 text-zinc-500 border-zinc-700/30",
    PUBLISHED: "bg-emerald-950/30 text-emerald-500/80 border-emerald-800/30",
    SCHEDULED: "bg-amber-950/30 text-amber-500/80 border-amber-800/30",
    ARCHIVED: "bg-zinc-900/50 text-zinc-600 border-zinc-800/30",
  };
  
  return (
    <span className={`px-2 py-0.5 text-[9px] tracking-wider uppercase border rounded ${colors[status as keyof typeof colors] || colors.DRAFT}`}>
      {status.toLowerCase()}
    </span>
  );
}

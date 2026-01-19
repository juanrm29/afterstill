"use client";

import { useState } from "react";
import Link from "next/link";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Writing {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: Date | null;
  updatedAt: Date;
  viewCount: number;
  tags: { tag: Tag }[];
}

interface Props {
  writings: Writing[];
  tags: Tag[];
}

export default function WritingsListClient({ writings, tags }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredWritings = writings.filter((w) => {
    const matchesFilter = filter === "all" || w.status === filter;
    const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
              <Link href="/admin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Dashboard
              </Link>
              <Link href="/admin/writings" className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors tracking-wider">
                Writings
              </Link>
              <Link href="/admin/tags" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Tags
              </Link>
              <Link href="/admin/settings" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extralight tracking-wide text-zinc-300" style={{ fontFamily: "var(--font-cormorant), serif" }}>
            Writings
          </h1>
          <Link
            href="/admin/writings/new"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700/40 rounded-lg text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-600/50 transition-all duration-300 text-sm tracking-wider"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Writing
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            {["all", "DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-xs tracking-wider rounded-lg transition-all duration-300 ${
                  filter === status
                    ? "bg-zinc-800/60 text-zinc-300 border border-zinc-700/50"
                    : "text-zinc-600 hover:text-zinc-500"
                }`}
              >
                {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-64 px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-zinc-400 placeholder-zinc-700 focus:outline-none focus:border-zinc-700/70 text-sm"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Writings list */}
        {filteredWritings.length > 0 ? (
          <div className="space-y-2">
            {filteredWritings.map((writing) => (
              <Link
                key={writing.id}
                href={`/admin/writings/${writing.id}`}
                className="flex items-center justify-between px-4 py-4 bg-zinc-900/30 border border-zinc-800/30 rounded-lg hover:bg-zinc-900/50 hover:border-zinc-700/40 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <StatusBadge status={writing.status} />
                  <div>
                    <h3 className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors mb-1">
                      {writing.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-600">/{writing.slug}</span>
                      {writing.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {writing.tags.slice(0, 3).map(({ tag }) => (
                            <span key={tag.id} className="px-1.5 py-0.5 text-[9px] bg-zinc-800/50 text-zinc-600 rounded">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-xs text-zinc-600">
                  <span>{writing.viewCount} views</span>
                  <span className="w-24 text-right">{new Date(writing.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900/20 border border-zinc-800/30 rounded-lg">
            <p className="text-sm text-zinc-600 mb-4">
              {search ? "No writings match your search" : "No writings yet"}
            </p>
            {!search && (
              <Link
                href="/admin/writings/new"
                className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Create your first writing →
              </Link>
            )}
          </div>
        )}
      </main>
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
    <span className={`px-2 py-0.5 text-[9px] tracking-wider uppercase border rounded w-20 text-center ${colors[status as keyof typeof colors] || colors.DRAFT}`}>
      {status.toLowerCase()}
    </span>
  );
}
